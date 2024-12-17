import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Add more dummy users
const DUMMY_USERS = [
  {
    name: 'John Farmer',
    email: 'john@example.com',
    auth0Id: 'auth0|123456',
    picture: 'https://example.com/john.jpg',
    roleType: 'FARMER'
  },
  {
    name: 'Mary Agriculture',
    email: 'mary@example.com',
    auth0Id: 'auth0|789012',
    picture: 'https://example.com/mary.jpg',
    roleType: 'EXPERT'
  }
];

const DUMMY_CROPS = [
  { name: 'Wheat', type: 'Cereal', variety: 'Winter Wheat', nitrogen: new Decimal(180) },
  { name: 'Corn', type: 'Cereal', variety: 'Sweet Corn', nitrogen: new Decimal(200) },
  { name: 'Potatoes', type: 'Root', variety: 'Russet', nitrogen: new Decimal(160) },
  { name: 'Soybeans', type: 'Legume', variety: 'Group 1', nitrogen: new Decimal(0) },
  { name: 'Barley', type: 'Cereal', variety: 'Spring Barley', nitrogen: new Decimal(140) }
];

const SOIL_TYPES = ['Clay', 'Sandy', 'Loam', 'Silt', 'Peat'];
const CLIMATES = ['Temperate', 'Continental', 'Mediterranean'];

// Expanded recommendations with more detailed data
const DUMMY_RECOMMENDATIONS = [
  {
    name: 'Potato Best Practices',
    type: 'RECOMMENDATION',
    variety: 'All Potato Varieties',
    description: `Comprehensive guide for potato cultivation:
    - Plant in well-drained soil
    - Maintain proper spacing
    - Monitor for common diseases
    - Optimal harvest timing`,
    pests: ['Colorado Potato Beetle', 'Aphids', 'Wireworms'],
    diseases: ['Late Blight', 'Early Blight', 'Scab'],
    fertilizers: ['NPK 5-10-5', 'Potassium Sulfate'],
    nitrogen: new Decimal(140),
    soilType: 'Sandy Loam',
    climate: 'Temperate',
    repeatYears: 4
  },
  {
    name: 'Wheat after Soybeans',
    type: 'RECOMMENDATION',
    variety: 'Winter Wheat',
    description: 'Plant wheat after soybeans for optimal nitrogen utilization. The residual nitrogen from soybean cultivation enhances wheat growth.',
    pests: ['Aphids', 'Hessian Fly', 'Wheat Midge'],
    diseases: ['Powdery Mildew', 'Rust', 'Septoria'],
    fertilizers: ['NPK 20-20-20', 'Ammonium Nitrate'],
    nitrogen: new Decimal(160),
    soilType: 'Clay',
    climate: 'Temperate',
    repeatYears: 2
  },
  {
    name: 'Corn after Alfalfa',
    type: 'RECOMMENDATION',
    variety: 'Field Corn',
    description: 'Corn performs exceptionally well after alfalfa due to nitrogen fixation and improved soil structure.',
    pests: ['Corn Borer', 'Rootworm', 'Armyworm'],
    diseases: ['Gray Leaf Spot', 'Northern Corn Leaf Blight', 'Stalk Rot'],
    fertilizers: ['Urea', 'DAP'],
    nitrogen: new Decimal(120),
    soilType: 'Loam',
    climate: 'Continental',
    repeatYears: 1
  },
  {
    name: 'Potato Rotation Guide',
    type: 'RECOMMENDATION',
    variety: 'All varieties',
    description: 'Best practices for potato rotation to prevent soil-borne diseases and maintain soil health.',
    pests: ['Colorado Potato Beetle', 'Wireworms', 'Potato Aphids'],
    diseases: ['Late Blight', 'Early Blight', 'Black Scurf'],
    fertilizers: ['NPK 14-14-14', 'Potassium Sulfate'],
    nitrogen: new Decimal(140),
    soilType: 'Sandy Loam',
    climate: 'Mediterranean',
    repeatYears: 4
  }
];

export async function POST() {
  try {
    const targetEmail = 'oltean.alexandru11@gmail.com';
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create additional users first
    const createdUsers = await Promise.all(
      DUMMY_USERS.map(userData =>
        prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            auth0Id: userData.auth0Id,
            picture: userData.picture,
            roleType: userData.roleType
          }
        })
      )
    );

    // Generate recommendations with complete data
    const recommendations = await Promise.all(
      DUMMY_RECOMMENDATIONS.map(async (recData) => {
        const recommendation = await prisma.crop.create({
          data: {
            userId: user.id, // Use main user for recommendations
            cropName: recData.name,
            cropType: recData.type,
            cropVariety: recData.variety,
            description: recData.description,
            soilType: recData.soilType,
            climate: recData.climate,
            ItShouldNotBeRepeatedForXYears: recData.repeatYears,
            nitrogenDemand: recData.nitrogen,
            nitrogenSupply: new Decimal(Math.floor(Math.random() * 100)),
            soilResidualNitrogen: new Decimal(Math.floor(Math.random() * 50)),
            plantingDate: new Date(),
            harvestingDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
          }
        });

        // Add all recommendation details with correct casing
        await prisma.cropDetail.createMany({
          data: [
            ...recData.pests.map(pest => ({
              cropId: recommendation.id,
              detailType: 'PEST',
              value: pest
            })),
            ...recData.diseases.map(disease => ({
              cropId: recommendation.id,
              detailType: 'DISEASE',
              value: disease
            })),
            ...recData.fertilizers.map(fertilizer => ({
              cropId: recommendation.id,
              detailType: 'FERTILIZER',
              value: fertilizer
            }))
          ]
        });

        return recommendation;
      })
    );

    // Generate 5 crops with details
    const crops = await Promise.all(
      DUMMY_CROPS.map(async (cropData) => {
        const crop = await prisma.crop.create({
          data: {
            userId: user.id,
            cropName: cropData.name,
            cropType: cropData.type,
            cropVariety: cropData.variety,
            plantingDate: new Date(),
            harvestingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            description: `Sample description for ${cropData.name}`,
            soilType: SOIL_TYPES[Math.floor(Math.random() * SOIL_TYPES.length)],
            climate: CLIMATES[Math.floor(Math.random() * CLIMATES.length)],
            ItShouldNotBeRepeatedForXYears: Math.floor(Math.random() * 4) + 1,
            nitrogenDemand: cropData.nitrogen,
            nitrogenSupply: new Decimal(Math.floor(Math.random() * 100)),
            soilResidualNitrogen: new Decimal(Math.floor(Math.random() * 50))
          }
        });

        // Add crop details
        await prisma.cropDetail.createMany({
          data: [
            { cropId: crop.id, detailType: 'PEST', value: 'Common pest for ' + cropData.name },
            { cropId: crop.id, detailType: 'DISEASE', value: 'Common disease for ' + cropData.name },
            { cropId: crop.id, detailType: 'FERTILIZER', value: 'Recommended fertilizer for ' + cropData.name }
          ]
        });

        return crop;
      })
    );

    // Create 2 rotations with proper decimal fields
    const rotations = await Promise.all([
      prisma.rotation.create({
        data: {
          userId: user.id,
          rotationName: 'Main Field Rotation',
          fieldSize: new Decimal(100),
          numberOfDivisions: 4
        }
      }),
      prisma.rotation.create({
        data: {
          userId: user.id,
          rotationName: 'Secondary Field Rotation',
          fieldSize: new Decimal(50),
          numberOfDivisions: 3
        }
      })
    ]);

    // Create rotation plans with proper decimal fields
    for (const rotation of rotations) {
      for (let year = 1; year <= 3; year++) {
        for (let division = 1; division <= rotation.numberOfDivisions; division++) {
          await prisma.rotationPlan.create({
            data: {
              rotationId: rotation.id,
              year,
              division,
              cropId: crops[Math.floor(Math.random() * crops.length)].id,
              divisionSize: new Decimal(Number(rotation.fieldSize) / rotation.numberOfDivisions),
              nitrogenBalance: new Decimal(Math.random() * 100),
              plantingDate: new Date(2024, Math.floor(Math.random() * 12), 1),
              harvestingDate: new Date(2024, Math.floor(Math.random() * 12) + 6, 1)
            }
          });
        }
      }
    }

    // Create some posts
    await prisma.post.createMany({
      data: [
        {
          userId: user.id,
          title: 'My First Season',
          brief: 'Overview of my first farming season',
    description: `
      This is the story of my first season as a farmer. I learned a lot of things and I want to share them with you. 
      I hope you enjoy reading it as much as I enjoyed living it.This is the story of my first season as a farmer. I learned a lot of things and I want to share them with you. 
      I hope you enjoy reading it as much as I enjoyed living it.This is the story of my first season as a farmer. I learned a lot of things and I want to share them with you. 
      I hope you enjoy reading it as much as I enjoyed living it.This is the story of my first season as a farmer. I learned a lot of things and I want to share them with you. 
      I hope you enjoy reading it as much as I enjoyed living it.This is the story of my first season as a farmer. I learned a lot of things and I want to share them with you. 
      I hope you enjoy reading it as much as I enjoyed living it.This is the story of my first season as a farmer. I learned a lot of things and I want to share them with you. 
      I hope you enjoy reading it as much as I enjoyed living it.
    `
        },
        {
          userId: user.id,
          title: 'Crop Rotation Success',
          brief: 'How I improved soil health',
          description: `In-depth analysis of my rotation strategy and how it helped me improve soil health 
          and increase crop yield. I also discuss the challenges I faced and how I overcame them to achieve success in my farming journey.
          In-depth analysis of my rotation strategy and how it helped me improve soil health`


        }
      ]
    });

    // Create user crop selections
    await Promise.all(
      crops.map(crop =>
        prisma.userCropSelection.create({
          data: {
            userId: user.id,
            cropId: crop.id,
            selectionCount: Math.floor(Math.random() * 10)
          }
        })
      )
    );

    // Create crop selections for recommendations too
    await Promise.all(
      recommendations.map(recommendation =>
        prisma.userCropSelection.create({
          data: {
            userId: user.id,
            cropId: recommendation.id,
            selectionCount: 1 // Mark recommendations as selected
          }
        })
      )
    );

    return NextResponse.json({
      message: 'Dummy data generated successfully',
      stats: {
        users: createdUsers.length,
        recommendations: recommendations.length,
        // ... add other stats
      }
    });
  } catch (error) {
    console.error('Data generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate dummy data' },
      { status: 500 }
    );
  }
}
