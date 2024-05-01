import { Router } from "express";
const router = Router();

import { uploadProduct } from "../controllers/products/upload";
import { getProductFullInfo } from "../controllers/products/getFInfo";
import { addRatingAndReview } from "../controllers/products/addRatingAndReview";
import { addToCart } from "../controllers/products/addToUserCart";
import { getCart } from "../controllers/products/getUserCart";
import { deleteCartItem } from "../controllers/products/deleteCartItem";
import { updateCartQty } from "../controllers/products/updateQty";
import { deleteWishListItem } from "../controllers/products/deleteWishListItem";
import { addToWishList } from "../controllers/products/addToWishList";
import { getCartPrice } from "../controllers/products/getCartPrice";

router.route("/upload").post(uploadProduct);
router.route("/getFInfo/:product_id").get(getProductFullInfo);
router.route("/addRatingAndReview/:product_id").post(addRatingAndReview);
router.route("/addToCart").post(addToCart);
router.route("/getCart").get(getCart);
router.route("/deleteCartItem/:cart_id").delete(deleteCartItem);
router.route("/updateCartQty/:cart_id").patch(updateCartQty);
router.route("/deleteWishListItem/:wishlistItemId").delete(deleteWishListItem);
router.route("/addToWishList").post(addToWishList);
router.route("/getCartPrice").get(getCartPrice);

export default router;
