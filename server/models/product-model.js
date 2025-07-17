import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.methods.getDiscountedPrice = function (discountPercent) {
  return this.price - (this.price * discountPercent) / 100;
};

const productModel = mongoose.model("Product", productSchema);

export default productModel;
