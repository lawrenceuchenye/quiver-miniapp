import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";

import App from "./App.tsx";
import { config } from "./wagmi.ts";

import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <head>
          <style>
            @import
            url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Cascadia+Code:ital,wght@0,200..700;1,200..700&family=Cherry+Bomb+One&family=Monoton&family=Pacifico&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
            @import
            url('https://fonts.googleapis.com/css2?family=Limelight&display=swap');
            @import
            url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
            @import
            url('https://fonts.googleapis.com/css2?family=Limelight&family=Rowdies:wght@300;400;700&display=swap');
            @import
            url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap');
            @import
            url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Cascadia+Code:ital,wght@0,200..700;1,200..700&family=Cherry+Bomb+One&family=Pacifico&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
          </style>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
            integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </head>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
