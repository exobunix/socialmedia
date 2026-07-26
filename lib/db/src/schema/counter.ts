import mongoose, { Schema } from "mongoose";

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

export async function getNextSequenceValue(sequenceName: string): Promise<number> {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}
