export function getErrorMessage(err: any): string {
  if (err.response?.data?.message) {
    if (Array.isArray(err.response.data.message)) {
      return err.response.data.message[0];
    }
    return err.response.data.message;
  }
  return err.message || "Bir hata oluştu.";
}
