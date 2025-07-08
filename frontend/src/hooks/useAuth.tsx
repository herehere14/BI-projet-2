import { useContext } from "react";
import { AuthContext } from "../context/AuthProvider";

// Small convenience hook to access the authentication context
export const useAuth = () => useContext(AuthContext);