export default function clearUserSession(req, res) {
    req.session.destroy((err) => {
      if (err) console.error("Error al destruir la sesión:", err);
    });
  
    res.clearCookie("userAccessToken");
    res.clearCookie("adminAuth");
  
    return 
  }
  