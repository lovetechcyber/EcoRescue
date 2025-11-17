// helpers for geo computations
function makePoint(lng, lat) {
  return { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
}

module.exports = { makePoint };
