import type { Request, Response } from "express";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import os from "os";
import path from "path";
import { Jimp } from "jimp";
import { createRequire } from "module";
import { Exam } from "../../models/Exam.ts";
import { Submission } from "../../models/Submission.ts";
import { UIDMap } from "../../models/UIDMap.ts";
import { Types } from "mongoose";
import { runWithConcurrency } from "../../utils/runWithConcurrency.ts";

const require = createRequire(import.meta.url);
const jsQR = require("jsqr");

type PopplerModule = {
  convert: (pdfPath: string, options: {
    format: "png";
    out_dir: string;
    out_prefix: string;
    page: number;
    scale: number;
  }) => Promise<unknown>;
};

interface QRPayload {
  uid: string;
}

let popplerModule: PopplerModule | null = null;

const getPoppler = (): PopplerModule => {
  if (process.platform === "linux") {
    throw new Error(
      "Bulk scan upload is not available on Linux because it depends on pdf-poppler. Deploy this route with a Linux-compatible PDF converter before using it on Render."
    );
  }

  if (!popplerModule) {
    popplerModule = require("pdf-poppler") as PopplerModule;
  }

  return popplerModule;
};

const convertPdfToImage = async (pdfBuffer: Buffer): Promise<string> => {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const newDoc = await PDFDocument.create();

  const [firstPage] = await newDoc.copyPages(srcDoc, [0]);
  newDoc.addPage(firstPage);

  const singlePageBuffer = await newDoc.save();
  const tempPdfPath = path.join(os.tmpdir(), `page1-${Date.now()}.pdf`);
  fs.writeFileSync(tempPdfPath, singlePageBuffer);

  const outputImageBase = path.join(os.tmpdir(), `page1-${Date.now()}`);
  const expectedImagePath = `${outputImageBase}-1.png`; // 🟢 Important

  const options = {
    format: "png" as const,
    out_dir: path.dirname(outputImageBase),
    out_prefix: path.basename(outputImageBase),
    page: 1,
    scale: 500
  };

  const poppler = getPoppler();
  await poppler.convert(tempPdfPath, options);

  if (!fs.existsSync(expectedImagePath)) {
    // Optional debug log
    console.error("Available temp files:", fs.readdirSync(os.tmpdir()));
    throw new Error(`Image was not generated: ${expectedImagePath}`);
  }

  return expectedImagePath;
};

const decodeQrFromImage = async (imagePath: string): Promise<QRPayload> => {
  const image = await Jimp.read(imagePath);
  const { data, width, height } = image.bitmap;

  const qrCode = jsQR(new Uint8ClampedArray(data), width, height);
  if (!qrCode) throw new Error("QR not detected");

  let parsed: any;
  try {
    parsed = JSON.parse(qrCode.data);
  } catch {
    throw new Error("QR data is not valid JSON");
  }

  if (!parsed.uid) throw new Error("QR payload missing UID");

  return parsed as QRPayload;
};

const extractPdfWithoutFirstPage = async (pdfBuffer: Buffer): Promise<Buffer> => {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages <= 1) throw new Error("Cannot remove first page from a single-page PDF.");

  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, Array.from({ length: totalPages - 1 }, (_, i) => i + 1));
  pages.forEach(page => newDoc.addPage(page));

  const uint8Array = await newDoc.save();
  return Buffer.from(uint8Array);
};

export const handleBulkUploadScans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const { examId } = req.params;

    const exam = await Exam.findById(examId).populate("course batch");
    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }

    const tasks = files.map(file => async () => {
      let imagePath = "";
      try {
        if (!file.buffer || file.buffer.length < 100) {
          throw new Error("Invalid file buffer");
        }

        imagePath = await convertPdfToImage(file.buffer);
        const qrData = await decodeQrFromImage(imagePath);

        const uidEntry = await UIDMap.findOne({ uid: qrData.uid });
        if (!uidEntry) throw new Error("Invalid UID – not mapped");

        if (uidEntry.examId.toString() !== examId) {
          throw new Error("UID mismatch with target exam");
        }

        const trimmedPdf = await extractPdfWithoutFirstPage(file.buffer);

        await Submission.findOneAndUpdate(
          {
            student: uidEntry.studentId,
            exam: uidEntry.examId
          },
          {
            student: new Types.ObjectId(uidEntry.studentId),
            exam: new Types.ObjectId(uidEntry.examId),
            course: exam.course,
            batch: exam.batch,
            answerPdf: trimmedPdf,
            answerPdfMimeType: file.mimetype,
            submittedAt: new Date()
          },
          { upsert: true }
        );

        return {
          fileName: file.originalname,
          studentId: uidEntry.studentId.toString(),
          imagePath
        };
      } catch (err) {
        return {
          fileName: file.originalname,
          error: err instanceof Error ? err.message : "Unknown error"
        };
      } finally {
        if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }
    });

    const results = await runWithConcurrency(3, tasks);

    res.status(200).json({
      message: "Step 1–5 complete. Submissions saved to DB.",
      results,
      successCount: results.filter(r => !r.error).length,
      failureCount: results.filter(r => r.error).length
    });
  } catch (err) {
    console.error("❌ Final crash in bulk upload:", err);
    res.status(500).json({ message: "Server crash during bulk processing" });
  }
};
