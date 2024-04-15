export {};

const authCheck = require('../Middleware/authCheck');
// pages/api/crops.js
import { getCrop, setCrop, getAllCrops, setSelectare, getCropRecommendations, addCropRecommendation, deleteCrop, getSpecificCrop } from '../../controllers/cropController';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      if (req.query.id) {
        return await getCrop(req, res);
      } else {
        return await getAllCrops(req, res);
      }
    case 'POST':
      return await setCrop(req, res);
    case 'PUT':
      return await setCrop(req, res);
    case 'DELETE':
      return await deleteCrop(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// pages/api/crops/[id].js
import { setSelectare, getCropRecommendations, addCropRecommendation, getSpecificCrop } from '../../controllers/cropController';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await getSpecificCrop(req, res);
    case 'POST':
      return await setSelectare(req, res);
    case 'PUT':
      return await addCropRecommendation(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// pages/api/cropRotation.js
import { generateCropRotation, getCropRotation, updateNitrogenBalanceAndRegenerateRotation } from '../../controllers/rotationController';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await getCropRotation(req, res);
    case 'POST':
      return await generateCropRotation(req, res);
    case 'PUT':
      return await updateNitrogenBalanceAndRegenerateRotation(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// pages/api/cropRotation/fields.js
import { updateDivisionSizeAndRedistribute } from '../../controllers/rotationController';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'PUT':
      return await updateDivisionSizeAndRedistribute(req, res);
    default:
      res.setHeader('Allow', ['PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// pages/api/cropRotation/[id].js
import { getCropRotation } from '../../controllers/rotationController';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await getCropRotation(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

