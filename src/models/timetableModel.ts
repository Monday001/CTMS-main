// Timetable.ts
import mongoose, { Document, Model } from "mongoose";

// Define an interface representing the PDF details
interface PdfDetails {
  size: number;
  type: string;
  name: string;
  lastModified: string;
}

// Define a Mongoose schema for the PDF details
const PdfDetailsSchema = new mongoose.Schema({
  size: {
    type: Number,
    default: true,
  },
  type: {
    type: String,
    default: true,
  },
  name: {
    type: String,
    default: true,
  },
  lastModified: {
    type: String,
    default: true,
  },
});
// Define a Mongoose model for the PDF details
const TimetableModel = mongoose.models.PdfDetails || mongoose.model("PdfDetails", PdfDetailsSchema);

// Export the Timetable model
export const Timetable: Model<Document & PdfDetails> = TimetableModel;
