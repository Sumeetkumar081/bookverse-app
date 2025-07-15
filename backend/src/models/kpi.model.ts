
import mongoose, { Schema, Document } from 'mongoose';

export interface IKpi extends Document {
  singleton: boolean; // To ensure only one document
  totalBooksBorrowed: number;
  totalGiveaways: number;
}

const KpiSchema: Schema = new Schema({
    singleton: {
        type: Boolean,
        default: true,
        unique: true,
        required: true,
    },
    totalBooksBorrowed: {
        type: Number,
        default: 0,
        required: true,
    },
    totalGiveaways: {
        type: Number,
        default: 0,
        required: true,
    },
});

const Kpi = mongoose.model<IKpi>('Kpi', KpiSchema);
export default Kpi;
