import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Html5Qrcode } from "html5-qrcode";

import { Page } from "../components/Page";
import { Spinner } from "../components/Spinner";
import { Button } from "../components/Button";
import { EmptyCard } from "../components/EmptyCard";

const ScannerContainer = styled.div`
  width: 100%;
  height: calc(100vh - 2rem);
  max-width: 32rem;
  min-width: 24rem;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
`;

const Container = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding-top: 4rem;
  gap: 1rem;
`;

const VideoContainer = styled.div`
  width: 100%;
  height: 32rem;
  overflow: hidden;
  border-radius: 2rem;
  background: #000;
  box-shadow: 0px 0px 24px rgba(0, 0, 0, 0.2), 0px 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  #qr-reader {
    width: 100% !important;
    height: 32rem !important;
    border: none !important;
    position: relative !important;
    overflow: hidden !important;
  }

  video {
    width: 100% !important;
    height: 32rem !important;
    object-fit: cover !important;
    border-radius: 2rem;
    position: relative !important;
    overflow: hidden !important;
  }

  #qr-shaded-region {
    inset: -6rem !important;
    border-radius: 15rem !important;
    border-width: 14rem !important;
    border-color: rgba(0, 0, 0, 0.5) !important;
    position: absolute !important;
    overflow: hidden !important;

    * {
      display: none !important;
    }
  }

  .qr-highlighted-region {
    border: 2px solid #fff !important;
    border-radius: 12px !important;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5) !important;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 2rem;
  height: 3rem;
  color: red;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;

  ${(props) =>
    props.$visible &&
    `
      opacity: 1;
    `}
`;

export const ScanQRCode = () => {
  const [data, setData] = useState("");
  const [hasPermission, setHasPermission] = useState(null);
  const html5QrCode = useRef(null);

  useEffect(() => {
    // Reset data state when component mounts
    setData("");
    requestCameraPermission();
  }, []);

  useEffect(() => {
    if (!hasPermission) return;

    const initializeScanner = () => {
      if (document.getElementById("qr-reader")) {
        html5QrCode.current = new Html5Qrcode("qr-reader");
        startScanner();
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeScanner, 100);

    return () => {
      clearTimeout(timeoutId);
      if (html5QrCode.current?.isScanning) {
        html5QrCode.current
          .stop()
          .then(() => {
            html5QrCode.current.clear();
          })
          .catch(() => {
            // Silently handle any cleanup errors
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  const requestCameraPermission = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setHasPermission(true);
        stream.getTracks().forEach((track) => track.stop());
      })
      .catch(() => {
        setHasPermission(false);
      });
  };

  const isValidUrl = (url) => {
    return url.startsWith("https://wave.leo.gd");
  };

  const handleQrCodeScan = (decodedText) => {
    setData(decodedText);
    if (!isValidUrl(decodedText)) {
      setTimeout(() => setData(""), 2000);
    } else {
      html5QrCode.current
        .stop()
        .then(() => {
          html5QrCode.current.clear();
          window.location.replace(decodedText);
        })
        .catch(() => {
          window.location.replace(decodedText);
        });
    }
  };

  const startScanner = () => {
    html5QrCode.current
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        handleQrCodeScan,
        () => {}
      )
      .catch(() => {});
  };

  return (
    <Page>
      <ScannerContainer>
        {hasPermission === null ? (
          <EmptyCard>
            <Spinner />
          </EmptyCard>
        ) : !hasPermission ? (
          <EmptyCard>
            <p>To scan QR codes, please allow camera permissions.</p>
            <br />
            <Button
              $size="small"
              $stretch="fit"
              $type="text"
              onClick={requestCameraPermission}
              $label="Allow camera"
            />
          </EmptyCard>
        ) : (
          <Container>
            {data && isValidUrl(data) ? (
              <Spinner />
            ) : (
              <VideoContainer id="qr-reader" />
            )}
            <ErrorMessage $visible={data && !isValidUrl(data)}>
              <p>Sorry, that's not a valid Wave QR code.</p>
            </ErrorMessage>
          </Container>
        )}
      </ScannerContainer>
    </Page>
  );
};
