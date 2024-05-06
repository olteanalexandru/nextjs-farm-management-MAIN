//crops

//GET paths and params docs
// for single crop 
// API_URL + "/crops/crop/id/" + id
// for all crops
// API_URL + "/crops/crops/retrieve/all"
// for search
// API_URL + "/crops/crops/search/" + searchWords
// for recommendations
// API_URL + "/crops/crops/recommendations/" + cropName

//POST paths and params docs
// for single crop
// API_URL + "/crops/crop/id/" + id
// for recommendations
// API_URL + "/crops/crops/recommendations " + id

//PUT paths and params docs
// for single crop
// API_URL + "/crops/crops/id/" + id
// API_URL + "/crops/crops/id/" + id + "/recommendations"

//DELETE paths and params docs
// for single crop
// API_URL + "/crops/crops/:userId/" + :cropId

// posts

//GET paths and params docs
// for single post
// API_URL + "/post/id/" + id     --tested postman

// for all posts
// API_URL + "/post/count/" + count   --tested postman
// for search
// API_URL + "/post/search/" + search  --tested postman
// for all posts
// API_URL + "/posts/retrieve/all"    --tested postman

//PUT paths and params docs






using ASP.net BLAZOR generate a farming crops management single page  . With an SQLlite database that has items like : 
  user: {
    type: String,
    required: true,
    ref: 'Auth0 user',
  }
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
  },
  cropType: {
    type: String,
    required: false,
  },
  cropVariety: {
    type: String,
    required: false,
  },
  plantingPeriod: {
    type: String,
    required: false,
  },
  harvestingPeriod: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String, 
    required: false,
  },
  soilType: {
    type: String,
    required: false,
  },
  climate: {
    type: String,
    required: false,
  },
  ItShouldNotBeRepeatedForHowmanyYearsOnSameField: {
    type: Number,
    required: false,
  },
  fertilizers: {
    type: [String],
    required: false,
  },
  pests: {
    type: [String],
    required: false,
  },
  diseases: {
    type: [String],
    required: false,
  },
  nitrogenSupply: {
    type: Number,
    required: false,
  },
  nitrogenDemand: {
    type: Number,
    required: false,
  },
  soilResidualNitrogen: {
    type: Number,
    required: false,
  },

