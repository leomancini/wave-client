import { createContext, useContext, useState } from "react";

const MoreMenuContext = createContext();

export const useMoreMenu = () => {
  const context = useContext(MoreMenuContext);
  if (!context) {
    throw new Error("useMoreMenu must be used within a MoreMenuProvider");
  }
  return context;
};

export const MoreMenuProvider = ({ children }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <MoreMenuContext.Provider value={{ isMoreMenuOpen, setIsMoreMenuOpen }}>
      {children}
    </MoreMenuContext.Provider>
  );
};
