import { NextResponse } from "next/server"

// Mock agricultural data - in production this would come from your database
const mockAgriculturalData = {
  landInformation: {
    soilTypes: [
      { region: "Amhara", adm1_pcode: "ET14", vertisols: 35, cambisols: 25, luvisols: 20, other: 20 },
      { region: "Oromia", adm1_pcode: "ET04", vertisols: 40, cambisols: 30, luvisols: 15, other: 15 },
      { region: "SNNP", adm1_pcode: "ET05", vertisols: 20, cambisols: 35, luvisols: 25, other: 20 },
      { region: "Tigray", adm1_pcode: "ET01", vertisols: 30, cambisols: 20, luvisols: 30, other: 20 },
      { region: "Afar", adm1_pcode: "ET02", vertisols: 10, cambisols: 15, luvisols: 25, other: 50 },
      { region: "Somali", adm1_pcode: "ET05", vertisols: 5, cambisols: 10, luvisols: 20, other: 65 },
    ],
    landUse: [
      { region: "Amhara", adm1_pcode: "ET14", cropland: 45, pasture: 25, forest: 15, urban: 5, other: 10 },
      { region: "Oromia", adm1_pcode: "ET04", cropland: 50, pasture: 30, forest: 10, urban: 3, other: 7 },
      { region: "SNNP", adm1_pcode: "ET05", cropland: 40, pasture: 20, forest: 25, urban: 5, other: 10 },
      { region: "Tigray", adm1_pcode: "ET01", cropland: 35, pasture: 30, forest: 10, urban: 5, other: 20 },
      { region: "Afar", adm1_pcode: "ET02", cropland: 5, pasture: 70, forest: 2, urban: 3, other: 20 },
      { region: "Somali", adm1_pcode: "ET05", cropland: 3, pasture: 80, forest: 1, urban: 2, other: 14 },
    ],
    elevation: [
      { region: "Amhara", adm1_pcode: "ET14", avg_elevation: 2100, min_elevation: 500, max_elevation: 4200 },
      { region: "Oromia", adm1_pcode: "ET04", avg_elevation: 1800, min_elevation: 400, max_elevation: 4000 },
      { region: "SNNP", adm1_pcode: "ET05", avg_elevation: 1600, min_elevation: 300, max_elevation: 3500 },
      { region: "Tigray", adm1_pcode: "ET01", avg_elevation: 2000, min_elevation: 600, max_elevation: 3900 },
      { region: "Afar", adm1_pcode: "ET02", avg_elevation: 400, min_elevation: -125, max_elevation: 1500 },
      { region: "Somali", adm1_pcode: "ET05", avg_elevation: 800, min_elevation: 200, max_elevation: 2400 },
    ],
  },
  cropDistribution: {
    cerealCrops: [
      { region: "Amhara", adm1_pcode: "ET14", teff: 35, wheat: 25, barley: 20, maize: 15, sorghum: 5 },
      { region: "Oromia", adm1_pcode: "ET04", teff: 30, wheat: 20, barley: 15, maize: 25, sorghum: 10 },
      { region: "SNNP", adm1_pcode: "ET05", teff: 25, wheat: 15, barley: 10, maize: 35, sorghum: 15 },
      { region: "Tigray", adm1_pcode: "ET01", teff: 40, wheat: 30, barley: 20, maize: 8, sorghum: 2 },
      { region: "Afar", adm1_pcode: "ET02", teff: 5, wheat: 5, barley: 5, maize: 10, sorghum: 75 },
      { region: "Somali", adm1_pcode: "ET05", teff: 2, wheat: 3, barley: 5, maize: 15, sorghum: 75 },
    ],
    cashCrops: [
      { region: "Amhara", adm1_pcode: "ET14", coffee: 10, sesame: 25, niger_seed: 20, sunflower: 15, cotton: 30 },
      { region: "Oromia", adm1_pcode: "ET04", coffee: 60, sesame: 15, niger_seed: 10, sunflower: 10, cotton: 5 },
      { region: "SNNP", adm1_pcode: "ET05", coffee: 70, sesame: 5, niger_seed: 10, sunflower: 10, cotton: 5 },
      { region: "Tigray", adm1_pcode: "ET01", coffee: 5, sesame: 40, niger_seed: 25, sunflower: 20, cotton: 10 },
      { region: "Afar", adm1_pcode: "ET02", coffee: 0, sesame: 20, niger_seed: 5, sunflower: 10, cotton: 65 },
      { region: "Somali", adm1_pcode: "ET05", coffee: 0, sesame: 30, niger_seed: 10, sunflower: 20, cotton: 40 },
    ],
  },
  livestockInformation: [
    { region: "Amhara", adm1_pcode: "ET14", cattle: 12500000, sheep: 8200000, goats: 4100000, poultry: 15600000 },
    { region: "Oromia", adm1_pcode: "ET04", cattle: 18200000, sheep: 11800000, goats: 6200000, poultry: 22400000 },
    { region: "SNNP", adm1_pcode: "ET05", cattle: 8900000, sheep: 5600000, goats: 3800000, poultry: 12100000 },
    { region: "Tigray", adm1_pcode: "ET01", cattle: 4200000, sheep: 2800000, goats: 1900000, poultry: 6200000 },
    { region: "Afar", adm1_pcode: "ET02", cattle: 1800000, sheep: 2400000, goats: 4200000, poultry: 1200000 },
    { region: "Somali", adm1_pcode: "ET05", cattle: 2100000, sheep: 8900000, goats: 12400000, poultry: 2800000 },
  ],
  infrastructure: [
    {
      region: "Amhara",
      adm1_pcode: "ET14",
      irrigation_schemes: 145,
      storage_facilities: 89,
      markets: 234,
      cooperatives: 1250,
    },
    {
      region: "Oromia",
      adm1_pcode: "ET04",
      irrigation_schemes: 198,
      storage_facilities: 156,
      markets: 445,
      cooperatives: 2100,
    },
    {
      region: "SNNP",
      adm1_pcode: "ET05",
      irrigation_schemes: 87,
      storage_facilities: 67,
      markets: 189,
      cooperatives: 890,
    },
    {
      region: "Tigray",
      adm1_pcode: "ET01",
      irrigation_schemes: 76,
      storage_facilities: 45,
      markets: 123,
      cooperatives: 567,
    },
    {
      region: "Afar",
      adm1_pcode: "ET02",
      irrigation_schemes: 23,
      storage_facilities: 12,
      markets: 34,
      cooperatives: 89,
    },
    {
      region: "Somali",
      adm1_pcode: "ET05",
      irrigation_schemes: 18,
      storage_facilities: 15,
      markets: 67,
      cooperatives: 123,
    },
  ],
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "all"
    const subcategory = searchParams.get("subcategory")

    console.log("[v0] Fetching agricultural data - category:", category, "subcategory:", subcategory)

    let responseData = mockAgriculturalData

    if (category !== "all") {
      if (category === "land-information") {
        responseData = { landInformation: mockAgriculturalData.landInformation } as any
        if (subcategory) {
          responseData = {
            landInformation: {
              [subcategory]:
                mockAgriculturalData.landInformation[subcategory as keyof typeof mockAgriculturalData.landInformation],
            },
          } as any
        }
      } else if (category === "crop-distribution") {
        responseData = { cropDistribution: mockAgriculturalData.cropDistribution } as any
        if (subcategory) {
          responseData = {
            cropDistribution: {
              [subcategory]:
                mockAgriculturalData.cropDistribution[
                  subcategory as keyof typeof mockAgriculturalData.cropDistribution
                ],
            },
          } as any
        }
      } else if (category === "livestock-information") {
        responseData = { livestockInformation: mockAgriculturalData.livestockInformation } as any
      } else if (category === "infrastructure") {
        responseData = { infrastructure: mockAgriculturalData.infrastructure } as any
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      category,
      subcategory,
    })
  } catch (error) {
    console.error("[v0] Error fetching agricultural data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agricultural data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
