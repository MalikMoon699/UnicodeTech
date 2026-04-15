export const UpdateProfileHelper = async (userId, formData) => {
  try {
    const res = await API.patch(`/api/auth/${userId}`, formData);
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
};