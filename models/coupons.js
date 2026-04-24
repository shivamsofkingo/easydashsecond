import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },

        type: { type: String, enum: ["percentage", "fixed"], required: true },
        value: {
            type: Number, required: true, min: 0
        },
        min_order_value: {type: Number, default: 0
        },
        max_discount: {
            type: Number, default: null // only applicable for percentage
        },
        valid_from: {
            type: Date, required: true
        },
        valid_until: {
            type: Date, required: true
        },
        usage_limit: {
            type: Number, default: null // null = unlimited
        },
        used_count: { type: Number, default: 0 },
        per_user_limit: { type: Number, default: 1 },
        applicable_events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
        applicable_ticket_types: [{ type: String, uppercase: true }],
        is_active: {
            type: Boolean, default: true
        }
    },
    { timestamps: true }
);

CouponSchema.index({ code: 1, is_active: 1 });

export default mongoose.model("Coupon", CouponSchema);
