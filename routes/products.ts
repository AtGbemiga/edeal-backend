import { Router } from "express";
const router = Router();

import { uploadProduct } from "../controllers/products/upload";
import { getProductFullInfo } from "../controllers/products/getFInfo";
import { addRatingAndReview } from "../controllers/products/addRatingAndReview";
import { addToCart } from "../controllers/products/addToUserCart";
import { getCart } from "../controllers/products/getUserCart";

router.route("/upload").post(uploadProduct);
router.route("/getFInfo/:product_id").get(getProductFullInfo);
router.route("/addRatingAndReview/:product_id").post(addRatingAndReview);
router.route("/addToCart").post(addToCart);
router.route("/getCart").get(getCart);

export default router;
