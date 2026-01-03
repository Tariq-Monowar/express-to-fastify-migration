// import { Request, Response } from "express";
// import { PrismaClient } from "@prisma/client";
// import fs from "fs";
// import path from "path";
// import { data } from "../../../assets/v1/data";
// import { getImageUrl } from "../../../utils/base_utl";
import { data as characteristicIcons, data } from "../../../assets/v1/data";
import { Multer } from "multer";
import { baseUrl, getImageUrl } from "../../../utils/baseurl";
import { FileService } from "../../../utils/fileService";
// const prisma = new PrismaClient();


// -------------------------------------------
const normalizeGender = (gender: string) => {
  const g = gender.toUpperCase();
  return ["MALE", "FEMALE", "UNISEX"].includes(g) ? g : null;
};

const buildSearchQuery = (search: string) => {
  const isNumber = !isNaN(Number(search));
  return {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { Company: { contains: search, mode: "insensitive" } },
      {
        colors: {
          some: {
            OR: [
              { colorName: { contains: search, mode: "insensitive" } },
              { colorCode: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
      ...(isNumber ? [{ price: { equals: Number(search) } }] : []),
    ],
  };
};

const normalizes = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "_")
    .trim();
};

const buildFilterQuery = (query: any) => {
  const {
    name,
    brand,
    category,
    subCategory,
    typeOfShoes,
    offer,
    // size,
    colorName,
    colorCode,
    company,
    gender,
    availability,
    minPrice,
    maxPrice,
  } = query;

  const where: any = {};

  // Basic search filters
  if (name) where.name = { contains: name, mode: "insensitive" };
  if (brand) where.brand = { contains: brand, mode: "insensitive" };
  if (category) where.Category = { contains: category, mode: "insensitive" };
  if (subCategory && subCategory !== "null")
    where.Sub_Category = { contains: subCategory, mode: "insensitive" };

  // Shoes type filter
  if (typeOfShoes) {
    const types = Array.isArray(typeOfShoes) ? typeOfShoes : [typeOfShoes];
    where.typeOfShoes = { in: types, mode: "insensitive" };
  }

  // Offer filter (as string)
  if (offer) {
    where.offer = { contains: offer, mode: "insensitive" };
  }

  // Size filter inside JSON string
  // if (size) {
  //   try {
  //     const sizeFilters = typeof size === "string" ? JSON.parse(size) : size;
  //     if (Array.isArray(sizeFilters)) {
  //       where.size = {
  //         array_contains: sizeFilters.map((s) => ({ size: s.size })),
  //       };
  //     }
  //   } catch (err) {
  //     console.error("Invalid size JSON format in query:", err);
  //   }
  // }

  // Color name / code filter
  if (colorName || colorCode) {
    const colorNames = Array.isArray(colorName)
      ? colorName
      : colorName
      ? [colorName]
      : [];
    const colorCodes = Array.isArray(colorCode)
      ? colorCode
      : colorCode
      ? [colorCode]
      : [];

    where.colors = {
      some: {
        OR: [
          ...(colorNames.length > 0
            ? [{ colorName: { in: colorNames, mode: "insensitive" } }]
            : []),
          ...(colorCodes.length > 0
            ? [{ colorCode: { in: colorCodes, mode: "insensitive" } }]
            : []),
        ],
      },
    };
  }

  // Company
  if (company) {
    where.Company = { contains: company, mode: "insensitive" };
  }

  // Gender
  if (gender) {
    const g = gender.toUpperCase();
    if (["MALE", "FEMALE", "UNISEX"].includes(g)) {
      where.gender = g;
    }
  }

  // Availability
  if (availability !== undefined) {
    where.availability = availability === "true";
  }

  // Price range
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  return where;
};

const paginate = (limit: string, page: string) => {
  const itemsPerPage = Math.min(parseInt(limit), 50);
  const currentPage = Math.max(parseInt(page), 1);
  const skip = (currentPage - 1) * itemsPerPage;
  return { itemsPerPage, currentPage, skip };
};

const sortQuery = (sortBy: string, sortOrder: string) => {
  const allowed = ["createdAt", "price", "name", "brand"];
  const orderBy: any = {};
  if (allowed.includes(sortBy)) {
    orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
  } else {
    orderBy.createdAt = "desc";
  }
  return orderBy;
};

// const formatProductsWithImageUrls = (products: any[]) =>
//   products.map((product) => ({
//     ...product,
//     colors: product.colors.map((color) => ({
//       ...color,
//       images: color.images.map((image) => ({
//         ...image,
//         url: getImageUrl(`/uploads/${image.url}`),
//       })),
//     })),
//   }));

const formatProductsWithImageUrls = (products: any[]) =>
  products.map((product) => ({
    ...product,
    characteristics: mapCharacteristicsToDetails(product.characteristics || []),
    colors: product.colors.map((color) => ({
      ...color,
      images: color.images.map((image) => ({
        ...image,
        url: getImageUrl(image.url),
      })),
    })),
  }));

const mapCharacteristicsToDetails = (ids: number[]) => {
  return characteristicIcons
    .filter((item) => ids.includes(item.id))
    .map((item) => ({
      id: item.id,
      text: item.text,
      image: getImageUrl(`/assets/v1/KeinTitel/${item.image}`),
    }));
};

// ----------------------------------------------------------

export const createProduct = async (request, reply) => {
  console.log("createProduct");
  console.log("=======================================");
  console.log(request.body);
  console.log("=======================================");
  const prisma = request.server.prisma;
  try {
    const {
      name,
      brand,
      Category,
      Sub_Category,
      typeOfShoes,
      productDesc,
      price,
      availability,
      offer,
      size,
      feetFirstFit,
      footLength,
      technicalData,
      Company,
      gender,
      colors,
      question,
      characteristics,
    } = request.body;
    console.log("=======================================");
    console.log(request.body);
    console.log("=======================================");

    console.log(name);

    const files = request.files;

    if (!name || !brand) {
      reply.status(400).send({
        success: false,
        message: "Name and brand are required fields",
      });
      return;
    }

    // Debug logging
    console.log("=== createProduct Debug ===");
    console.log("Files received:", files ? files.length : 0);
    console.log("Files is array:", Array.isArray(files));
    if (files && Array.isArray(files) && files.length > 0) {
      console.log("First file:", files[0]);
    }
    console.log("Colors field:", colors);
    console.log("========================");

    if (!files || !Array.isArray(files) || files.length === 0) {
      reply.status(400).send({
        success: false,
        message: "No image files uploaded",
      });
      return;
    }

    let parsedColors: any[] = [];
    try {
      parsedColors = colors ? JSON.parse(colors) : [];
      console.log("Parsed colors:", parsedColors);
      console.log("Parsed colors length:", parsedColors.length);
    } catch (error) {
      console.error("Colors parsing error:", error);
      reply.status(400).send({
        success: false,
        message: "Invalid colors JSON format",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }

    // If no colors provided but files exist, create a default color
    if (parsedColors.length === 0 && files.length > 0) {
      console.log("No colors provided, creating default color with all images");
      parsedColors = [{
        colorName: "Default",
        colorCode: "#000000",
        images: Array(files.length).fill({}) // Create array with same length as files
      }];
    }

    let parsedCharacteristics: number[] = [];
    try {
      if (typeof characteristics === "string") {
        const cleanedString = characteristics.replace(/^"|"$/g, "");
        parsedCharacteristics = JSON.parse(cleanedString);
      } else {
        parsedCharacteristics = characteristics || [];
      }

      if (!Array.isArray(parsedCharacteristics)) {
        throw new Error("Characteristics must be an array");
      }

      parsedCharacteristics = parsedCharacteristics.map(Number);
    } catch (err) {
      console.log("Characteristics parsing error:", err);
      reply.status(400).send({
        success: false,
        message: "Invalid characteristics format",
        error: err.message,
      });
      return;
    }

    const normalizedGender = normalizeGender(gender);

    const numericPrice = price ? parseFloat(price) : null;
    const numericOffer = offer ? parseFloat(offer) : null;

    let fileIndex = 0;
    const colorsWithFiles = parsedColors.map((color) => {
      const imageFilenames: string[] = [];

      for (
        let i = 0;
        i < color.images.length && fileIndex < files.length;
        i++
      ) {
        imageFilenames.push(files[fileIndex].filename);
        fileIndex++;
      }

      return {
        colorName: color.colorName,
        colorCode: color.colorCode,
        images: imageFilenames,
      };
    });

    const createdProduct = await prisma.product.create({
      data: {
        name,
        brand,
        Category: Category || null,
        Sub_Category: Sub_Category || null,
        typeOfShoes: typeOfShoes || null,
        productDesc: productDesc || null,
        price: numericPrice,
        availability: availability === "true",
        offer: numericOffer,
        size: size || null,
        feetFirstFit: feetFirstFit || null,
        footLength: footLength || null,
        technicalData: technicalData || null,
        Company: Company || null,
        gender: normalizedGender as "MALE" | "FEMALE" | "UNISEX" | null,
        characteristics: parsedCharacteristics,
        question: question || null,
        colors: {
          create: colorsWithFiles.map((color) => ({
            colorName: color.colorName,
            colorCode: color.colorCode,
            images: {
              create: color.images.map((filename) => ({
                url: filename,
              })),
            },
          })),
        },
      },
      include: {
        colors: {
          include: {
            images: true,
          },
        },
      },
    });

    const productWithUrls = formatProductsWithImageUrls([createdProduct])[0];

    reply.status(201).send({
      success: true,
      message: "Product created successfully",
      product: productWithUrls,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to create product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateProduct = async (request, reply) => {
 
  const prisma = request.server.prisma;
  try {
    const { id } = request.params;
    const {
      name,
      brand,
      Category,
      Sub_Category,
      typeOfShoes,
      productDesc,
      price,
      availability,
      offer,
      size,
      feetFirstFit,
      footLength,
      technicalData,
      Company,
      gender,
      question,
      colors,
      characteristics, // Add characteristics to destructuring
    } = request.body;

    console.log("=======================================");
    console.log(name);
    console.log("=======================================");

    const files = request.files;

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: String(id),
      },
      include: {
        colors: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!existingProduct) {
      reply.status(404).json({
        message: "Product not found",
      });
      return;
    }

    let parsedColors;

    try {
      parsedColors = colors ? JSON.parse(colors) : [];
    } catch (e) {
      reply.status(400).send({
        success: false,
        message: "Invalid colors format",
      });
      return;
    }
 
    let fileIndex = 0;
    const colorsWithFiles = parsedColors.map((color: any) => {
      const colorImages = [];
 
      if (color.id) {
        const existingColor = existingProduct.colors.find(
          (ec) => ec.id === color.id
        );
        if (existingColor) {
          colorImages.push(...existingColor.images.map((img) => img.url));
        }
      }
 
      if (color.images) {
        for (const image of color.images) {
          if (
            image.isNew &&
            Array.isArray(files) &&
            fileIndex < files.length
          ) {
            colorImages.push(files[fileIndex].filename);
            fileIndex++;
          } else if (!image.isNew && image.filename) {
            colorImages.push(image.filename);
          }
        }
      }

      return {
        id: color.id,
        colorName: color.colorName,
        colorCode: color.colorCode,
        images: colorImages,
      };
    });
 
    let parsedCharacteristics: number[] = [];
    try {
      if (typeof characteristics === "string") {
        const cleanedString = characteristics.replace(/^"|"$/g, "");
        parsedCharacteristics = JSON.parse(cleanedString);
      } else {
        parsedCharacteristics = characteristics || [];
      }

      if (!Array.isArray(parsedCharacteristics)) {
        throw new Error("Characteristics must be an array");
      }

      parsedCharacteristics = parsedCharacteristics.map(Number);
    } catch (err) {
      console.log("Characteristics parsing error:", err);
      reply.status(400).send({
        success: false,
        message: "Invalid characteristics format",
        error: err.message,
      });
      return;
    }
 
    const updatedProduct = await prisma.product.update({
      where: {
        id: String(id),
      },
      data: {
        name,
        brand,
        Category: Category || null,
        Sub_Category: Sub_Category || null,
        typeOfShoes: typeOfShoes || null,
        productDesc: productDesc || null,
        price: price ? parseFloat(price) : null,
        availability: availability === "true",
        offer: offer ? parseFloat(offer) : null,
        size: size || null,
        feetFirstFit: feetFirstFit || null,
        footLength: footLength || null,
        technicalData: technicalData || null,
        Company: Company || null,
        question: question || null,
        gender: gender
          ? (gender.toString().toUpperCase() as "MALE" | "FEMALE" | "UNISEX")
          : null,
        characteristics: parsedCharacteristics,  
        colors: {
          deleteMany: {}, 
          create: colorsWithFiles.map((color: any) => ({
            colorName: color.colorName,
            colorCode: color.colorCode,
            images: {
              create: color.images.map((filename: string) => ({
                url: filename,
              })),
            },
          })),
        },
      },
      include: {
        colors: {
          include: {
            images: true,
          },
        },
      },
    });

    const productWithUrls = {
      ...updatedProduct,
      colors: updatedProduct.colors.map((color) => ({
        ...color,
        images: color.images.map((image) => ({
          ...image,
          url: getImageUrl(image.url),
        })),
      })),
    };

    reply.status(200).send({
      success: true,
      message: "Product updated successfully",
      product: productWithUrls,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to update product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllProducts = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        colors: {
          include: {
            images: true,
          },
        },
      },
    });

    const productsWithImageUrls = formatProductsWithImageUrls(products);

    reply.status(200).send({
      success: true,
      products: productsWithImageUrls,
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteImage = async (request, reply) => {
  const { id, imageName } = request.params;
  const prisma = request.server.prisma;

  try {
    const image = await prisma.image.findFirst({
      where: {
        url: imageName,
        color: {
          productId: String(id),
        },
      },
      include: {
        color: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!image) {
      reply.status(404).json({
        success: false,
        error: "Image not found in this product",
      });
      return;
    }

    if (imageName) {
      FileService.removeFile(imageName);
    }

    // Delete the image record from database
    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    reply.json({
      success: true,
      message: "Image deleted",
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const queryProducts = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const {
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      limit = "10",
      page = "1",
      question,
      size,
    } = request.query;

    // Only parse size if it exists and is not empty
    let parsedSize = [];
    if (size && size !== '') {
      try {
        parsedSize = JSON.parse(size as string);
      } catch (err) {
        console.error("Error parsing size:", err);
        parsedSize = [];
      }
    }

    const where = search
      ? buildSearchQuery(search as string)
      : buildFilterQuery(request.query);

    const orderBy = sortQuery(sortBy as string, sortOrder as string);
    const { itemsPerPage, currentPage, skip } = paginate(
      limit as string,
      page as string
    );

    let filteredProducts;
    let totalFilteredCount;

    // Get all matching products first
    const allMatchingProducts = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        colors: {
          include: {
            images: true,
          },
        },
      },
    });

    // Apply size filtering if needed
    let sizeFilteredProducts = allMatchingProducts;
    if (parsedSize.length > 0) {
      sizeFilteredProducts = allMatchingProducts.filter((product) => {
        if (!product.size) return false;
        try {
          const db_size = JSON.parse(product.size.toString());
          return parsedSize.some((sz) =>
            db_size.some((dbEl) => dbEl["size"] == sz["size"])
          );
        } catch (err) {
          console.error("Error parsing product size:", err);
          return false;
        }
      });
    }

    // Apply question filtering if needed
    if (question) {
      const question_json = JSON.parse(question as string);
      const inputAnswers = question_json["answers"];

      filteredProducts = sizeFilteredProducts.filter((product) => {
        try {
          const productQuestion = JSON.parse(product.question as string);
          const productAnswers = productQuestion["answers"];

          return inputAnswers.every((inputAnswer) =>
            productAnswers.some(
              (productAnswer) =>
                productAnswer["question"] === inputAnswer["question"] &&
                productAnswer["answer"] === inputAnswer["answer"]
            )
          );
        } catch (err) {
          console.error("Error parsing product question JSON:", err);
          return false;
        }
      });

      totalFilteredCount = filteredProducts.length;
      filteredProducts = filteredProducts.slice(skip, skip + itemsPerPage);
    } else {
      totalFilteredCount = sizeFilteredProducts.length;
      filteredProducts = sizeFilteredProducts.slice(skip, skip + itemsPerPage);
    }

    const productsWithUrls = formatProductsWithImageUrls(filteredProducts);
    const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);

    reply.status(200).send({
      success: true,
      products: productsWithUrls,
      pagination: {
        total: totalFilteredCount,
        currentPage,
        totalPages,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Query Products Error:", error);
    reply.status(500).send({
      success: false,
      message: "Error while querying products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// -----------------------------------------

// Helper normalize function (ignore case, spaces, symbols)
const normalize = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "_")
    .trim();
};

export const deleteProduct = async (request, reply) => {
  const { id } = request.params;
  const prisma = request.server.prisma;

  try {
    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      include: {
        colors: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!product) {
      reply.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    for (const color of product.colors) {
      for (const image of color.images) {
        // const filePath = path.join(__dirname, "../../../uploads", image.url);
        // if (fs.existsSync(filePath)) {
        //   fs.unlinkSync(filePath);
        // }
        FileService.removeFile(image.url);
      }
    }

    await prisma.product.delete({
      where: {
        id: String(id),
      },
    });

    reply.status(200).send({
      success: true,
      message: "Product and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Basic filtering: /products/query?name=nike&brand=nike

// Price range: /products/query?minPrice=50&maxPrice=100

// Category filtering: /products/query?category=running&subCategory=trail

// Size and color: /products/query?size=10&color=black

// Pagination: /products/query?page=2&limit=10

// Sorting: /products/query?sortBy=price&sortOrder=desc

export const getSingleProduct = async (request, reply) => {
  const { id } = request.params;
  const prisma = request.server.prisma;

  try {
    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      include: {
        colors: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!product) {
      reply.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Fetch recommended products based on similar attributes
    const recommendedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: product.id } }, // Exclude current product
          {
            OR: [
              { brand: product.brand },
              { Category: product.Category },
              // { typeOfShoes: product.typeOfShoes },
              // { Sub_Category: product.Sub_Category },
            ],
          },
        ],
      },
      take: 4, // Limit to 4 recommended products
      include: {
        colors: {
          include: {
            images: true,
          },
        },
      },
    });

    const productWithImageUrls = {
      ...product,
      characteristics: product.characteristics
        ? product.characteristics
            .map((id: number) => {
              const item = data.find((item) => item.id === id);
              return item
                ? {
                    ...item,
                    image: `${baseUrl}/assets/v1/KeinTitel/${item.image}`,
                  }
                : null;
            })
            .filter(Boolean)
        : [],
      colors: product.colors.map((color) => ({
        ...color,
        images: color.images.map((image) => ({
          ...image,
          url: getImageUrl(image.url),
        })),
      })),
    };

    // Format recommended products with image URLs
    const recommendedWithUrls =
      formatProductsWithImageUrls(recommendedProducts);

    reply.status(200).send({
      success: true,
      product: productWithImageUrls,
      recommendedProducts: recommendedWithUrls,
    });
  } catch (error) {
    console.error("Get Single Product Error:", error);
    reply.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const characteristicsIcons = async (request, reply) => {
  try {
    const iconsWithUrls = data.map((icon) => ({
      ...icon,
      image: getImageUrl(`/assets/v1/kein_titel/${icon.image}`),
    }));

    reply.status(200).send({
      success: true,
      data: iconsWithUrls,
    });

  } catch (error) {
    console.error("Get Technical Icons Error:", error);
    reply.status(500).send({
      success: false,
      message: "Failed to fetch technical icons",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getCategorizedProducts = async (request, reply) => {
  const prisma = request.server.prisma;
  try {
    const limit = request.query.limit ? parseInt(request.query.limit as string) : 10;

    // 1. First get unique categories and subcategories with counts
    const categoryCounts = await prisma.product.groupBy({
      by: ['Category'],
      where: {
        Category: { not: null }
      },
      _count: true
    });

    const subcategoryCounts = await prisma.product.groupBy({
      by: ['Sub_Category'],
      where: {
        Sub_Category: { 
          not: null,
          notIn: ['null', '']
        }
      },
      _count: true
    });

    // 2. Get products for each category with limit
    const categoryGroups = await Promise.all(
      categoryCounts.map(async ({ Category }) => {
        const products = await prisma.product.findMany({
          where: {
            Category,
            OR: [
              { Sub_Category: null },
              { Sub_Category: 'null' },
              { Sub_Category: '' }
            ]
          },
          select: {
            id: true,
            name: true,
            Category: true,
            Sub_Category: true,
            price: true,
            offer: true,
            availability: true,
            colors: {
              select: {
                id: true,
                colorName: true,
                colorCode: true,
                images: {
                  select: {
                    id: true,
                    url: true
                  }
                }
              }
            }
          },
          take: limit,
          orderBy: {
            createdAt: 'desc' // Get the most recent products
          }
        });

        return {
          name: Category,
          totalProducts: categoryCounts.find(c => c.Category === Category)._count,
          products: products.map(p => ({
            ...p,
            colors: p.colors.map(color => ({
              ...color,
              images: color.images.map(image => ({
                ...image,
                url: getImageUrl(`/uploads/${image.url}`)
              }))
            }))
          }))
        };
      })
    );

    // 3. Get products for each subcategory with limit
    const subcategoryGroups = await Promise.all(
      subcategoryCounts
        .filter(({ Sub_Category }) => Sub_Category && Sub_Category !== 'null')
        .map(async ({ Sub_Category }) => {
          const products = await prisma.product.findMany({
            where: {
              Sub_Category
            },
            select: {
              id: true,
              name: true,
              Category: true,
              Sub_Category: true,
              price: true,
              offer: true,
              availability: true,
              colors: {
                select: {
                  id: true,
                  colorName: true,
                  colorCode: true,
                  images: {
                    select: {
                      id: true,
                      url: true
                    }
                  }
                }
              }
            },
            take: limit,
            orderBy: {
              createdAt: 'desc'
            }
          });

          return {
            name: Sub_Category,
            totalProducts: subcategoryCounts.find(s => s.Sub_Category === Sub_Category)._count,
            products: products.map(p => ({
              ...p,
              colors: p.colors.map(color => ({
                ...color,
                images: color.images.map(image => ({
                  ...image,
                  url: getImageUrl(`/uploads/${image.url}`)
                }))
              }))
            }))
          };
        })
    );

    // 4. Combine results
    const result = [
      ...categoryGroups,
      ...subcategoryGroups
    ];

    reply.status(200).send({
      success: true,
      data: result,
      meta: {
        limit,
        totalCategories: categoryGroups.length,
        totalSubcategories: subcategoryGroups.length
      }
    });
  } catch (error) {
    console.error('Error in getCategorizedProducts:', error);
    reply.status(500).send({
      success: false,
      message: 'Failed to fetch categorized products'
    });
  }
};
