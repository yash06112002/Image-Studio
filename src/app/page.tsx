"use client";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { Dialog } from "@headlessui/react";
import { HiDownload } from "react-icons/hi";

export default function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("ghibli");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const styles = ["ghibli", "lego", "watercolor", "anime"];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles: File[]) => {
      setFile(acceptedFiles[0]);
      setPreview(URL.createObjectURL(acceptedFiles[0]));
    },
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("style", selectedStyle);

    const response = await fetch("/api/transform", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      setTransformedImage(data.transformedImageUrl);
    }
    setLoading(false);
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transformed-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const openModal = (image: string) => {
    setModalImage(image);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full backdrop-blur-md bg-[#0F172A]/80 z-50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Image Studio
          </h1>
          <div className="flex gap-4">
            <a href="#" className="hover:text-blue-400 transition-colors">
              Gallery
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 px-4 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Transform Your Images
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Convert your photos into stunning artistic styles using AI-powered
            transformations
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 p-8 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-lg shadow-lg">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`relative group border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-600 hover:border-blue-500 hover:bg-blue-500/5"
              }
              max-w-2xl mx-auto w-full aspect-video flex flex-col items-center justify-center`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center">
                <AiOutlineCloudUpload className="text-3xl text-blue-400" />
              </div>
              <div>
                {isDragActive ? (
                  <p className="text-blue-400 text-lg font-medium">
                    Drop your image here
                  </p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop your image here
                    </p>
                    <p className="text-sm text-gray-400">
                      or click to select from your computer
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          {preview ? (
            <div className="flex flex-col items-center gap-4 mt-6">
              <h2 className="text-lg font-semibold text-gray-700">
                Original Image
              </h2>
              <img
                src={preview}
                alt="Original"
                className="w-40 h-40 object-contain rounded-lg shadow-lg border border-gray-200 cursor-pointer"
                onClick={() => openModal(preview)}
              />
            </div>
          ) : (
            <p className="text-gray-500 mt-4">
              No image selected. Please upload an image.
            </p>
          )}
          <div className="flex gap-4 mt-4">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`px-4 py-2 rounded-lg shadow-md transition ${
                  selectedStyle === style
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-md transition-transform ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "hover:shadow-lg hover:scale-105"
            }`}
          >
            {loading ? "Processing..." : "Transform Image"}
          </Button>
          {loading && (
            <p className="text-gray-600 mt-2 animate-pulse">
              Processing your image...
            </p>
          )}
          {preview && transformedImage && (
            <div className="w-full max-w-4xl mx-auto mt-12 p-6 rounded-2xl bg-gray-800/50 backdrop-blur">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 w-full">
                  <h3 className="text-xl font-medium mb-4 text-center">
                    Original
                  </h3>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => openModal(preview)}
                  >
                    <img
                      src={preview}
                      alt="Original"
                      className="w-full h-[300px] object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white">Click to enlarge</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-medium text-center">
                      Transformed
                    </h3>
                    {transformedImage && (
                      <button
                        onClick={() => handleDownload(transformedImage)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors text-white text-sm"
                      >
                        <HiDownload className="w-4 h-4" />
                        Download
                      </button>
                    )}
                  </div>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => openModal(transformedImage)}
                  >
                    <img
                      src={transformedImage}
                      alt="Transformed"
                      className="w-full h-[300px] object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white">Click to enlarge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              aria-hidden="true"
            />
            <div className="relative bg-gray-900 p-6 rounded-2xl max-w-[90vw] max-h-[90vh]">
              {modalImage && (
                <img
                  src={modalImage}
                  alt="Modal"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
