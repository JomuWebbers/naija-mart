import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const products = await prisma.product.findMany({
      where: {
        status: "approved",
        ...(category ? { category: category as string } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Product id is required" });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const isOwner = req.userId === product.sellerId;
    const isAdminUser = req.userRole === "admin";

    if (product.status !== "approved" && !isOwner && !isAdminUser) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const sellerId = req.userId;
    if (!sellerId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const {
      name,
      description,
      price,
      originalPrice,
      image,
      category,
      subcategory,
      stock,
    } = req.body;

    if (!name || !price || !image || !category) {
      return res
        .status(400)
        .json({ message: "Name, price, image, and category are required" });
    }

    const status = req.userRole === "admin" ? "approved" : "pending";

    const product = await prisma.product.create({
      data: {
        name, description, price, originalPrice, image, category, subcategory, stock,
        sellerId, status,
      },
    })


    res.status(201).json(product);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ message: "A product with this value already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Product id is required" });
    }

    //Only allow specific fields to be updated
    const allowedFields = [
      "name",
      "description",
      "price",
      "originalPrice",
      "image",
      "images",
      "category",
      "subcategory",
      "stock",
      "status",
      "negotiable",
      "fulfillmentMethod",
      "sellerState",
      "sellerLga",
      "sellerAddress",
      "deliveryDays",
      "chargeDeliveryFee",
      "deliveryFeeAmount"
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (field in req.body) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({message: "No valid fields to update"})
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res.json(product);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to update product" });
  }
};



export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Product id is required" });
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

export const getMyListings = async (req: AuthRequest, res: Response) => {
  try {
    const sellerId = req.userId;
    if (!sellerId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const products = await prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch your listings" });
  }
};

export const reviewListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Product id is required" });
    }
    if (status !== "approved" && status !== "rejected") {
      return res
        .status(400)
        .json({ message: 'Status must be "approved" or "rejected"' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { status },
    });

    res.json(product);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to review listing" });
  }
};
