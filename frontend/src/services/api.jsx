import axios from 'axios'


const api = axios.create({ baseURL: '/api', timeout: 15000 })


// attach access token automatically
api.interceptors.request.use((cfg) => {
const token = localStorage.getItem('accessToken')
if (token) cfg.headers.Authorization = `Bearer ${token}`
return cfg
})


// response interceptor: refresh token on 401
let isRefreshing = false
let subscribers = []
function onRefreshed(token) { subscribers.forEach(cb => cb(token)); subscribers = [] }
function addSubscriber(cb) { subscribers.push(cb) }


api.interceptors.response.use(r=>r, async err => {
const original = err.config
if (err.response && err.response.status === 401 && !original._retry) {
original._retry = true
if (!isRefreshing) {
isRefreshing = true
const refreshToken = localStorage.getItem('refreshToken')
try {
const res = await axios.post('/api/auth/refresh', { refreshToken })
localStorage.setItem('accessToken', res.data.accessToken)
localStorage.setItem('refreshToken', res.data.refreshToken)
onRefreshed(res.data.accessToken)
isRefreshing = false
return api(original)
} catch (e) {
isRefreshing = false
localStorage.removeItem('accessToken')
localStorage.removeItem('refreshToken')
window.location.href = '/login'
return Promise.reject(e)
}
}


return new Promise((resolve, reject) => {
addSubscriber((token) => {
original.headers.Authorization = `Bearer ${token}`
resolve(api(original))
})
})
}
return Promise.reject(err)
})

export const getUserAlerts = (userId) => api.get(`/alerts/user/${userId}`);
export const getAdminAlerts = () => api.get("/alerts/all");


export const submitReport = async ({ type, description, lng, lat, severity, metadata, images }) => {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("description", description);
  formData.append("lng", lng);
  formData.append("lat", lat);
  formData.append("severity", severity || "low");
  formData.append("metadata", JSON.stringify(metadata || {}));

  if (images && images.length) {
    images.forEach((img) => formData.append("images", img));
  }

  const token = localStorage.getItem("token"); // JWT auth token
  const res = await api.post("/reports", formData, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    },
  });

  return res.data;
};


export default api