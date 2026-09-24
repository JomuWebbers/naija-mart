

// src/types/express.d.ts
import "express";

declare global {
  namespace Express {
    interface Multer {
      File: import("multer").File;
    }
  }
}

