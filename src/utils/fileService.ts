import fs from "fs";

export class FileService {
  private static basePath = "uploads/";

  static removeFile(filename: string): void {
    console.log("removeFile");
    const path = `${this.basePath}${filename}`;
    fs.existsSync(path) && fs.unlinkSync(path);
  }

  static removeFiles(filenames: string[]): void {
    console.log("removeFiles");
    filenames.forEach(this.removeFile);
  }

  static removeFileByPath(path: string): void {
    console.log("removeFileByPath");
    fs.existsSync(path) && fs.unlinkSync(path);
  }
}