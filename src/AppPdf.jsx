import React, { useState, useEffect, useRef } from 'react';
import { Loader2, File, FilePlus } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configura il worker di PDF.js (assicurati che il percorso sia corretto)
GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@5.2.133/build/pdf.worker.min.mjs';

const App = () => {
    const [image, setImage] = useState(null); // Usato per l'anteprima, se necessario
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [extractedDateTime, setExtractedDateTime] = useState('');
    const tesseractWorkerRef = useRef(null);

    const initializeTesseract = async () => {
        if (!tesseractWorkerRef.current) {
            try {
                const { createWorker } = await import('tesseract.js');
                tesseractWorkerRef.current = await createWorker();
            } catch (error) {
                console.error("Failed to initialize Tesseract.js:", error);
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        initializeTesseract();

        return () => {
            if (tesseractWorkerRef.current) {
                tesseractWorkerRef.current.terminate();
                tesseractWorkerRef.current = null;
            }
        };
    }, []);

    const handlePdfChange = async (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setLoading(true);
            try {
                const pdfData = new Uint8Array(await file.arrayBuffer());
                const pdf = await getDocument({ data: pdfData }).promise;
                let allText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport: viewport }).promise;

                    // Convert canvas content to a Blob for Tesseract
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    const { data: { text } } = await tesseractWorkerRef.current.recognize(blob);
                    allText += text + '\n\n'; // Separate pages with newlines
                }
                setText(allText);
                extractSpecificData(allText); // Extract data from the combined text
            } catch (error) {
                console.error("Errore durante l'elaborazione del PDF:", error);
                setText('Errore durante il riconoscimento del testo dal PDF.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleOcr = async () => {
        // Questa funzione ora è superflua, ma la mantengo per chiarezza.
        // handlePdfChange gestisce l'OCR.
    };

     const extractSpecificData = (ocrText) => {
        const parolaChiave = 'Breaking changes:';
        const regex = new RegExp(`${parolaChiave}\\s*(.*)`);
        const match = ocrText.match(regex);

        if (match && match[1]) {
            setExtractedDateTime(match[1].trim());
        } else {
            setExtractedDateTime('Nessuna parola specifica trovata vicino alla parola indicata.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start pt-16">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">OCR App</h1>
            <p>Based on Tesseract library and PDF.js</p>
            <div className="mb-6 w-full max-w-md">
                <input
                    type="file"
                    id="pdfInput"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                />
                <label htmlFor="pdfInput" className="block mt-2 text-sm text-gray-500">
                    Carica un file PDF
                </label>
            </div>

            {/* Non mostrare più l'anteprima dell'immagine. Se necessario, si può aggiungere
                 la visualizzazione del canvas dopo il rendering del PDF, ma non è richiesto.  */}

            <div className="flex gap-4 mb-8">
                <button
                    onClick={handleOcr} // Questa funzione non fa più nulla direttamente
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin w-5 h-5" />
                            Elaborazione...
                        </>
                    ) : (
                        <>
                            <FilePlus className="w-5 h-5" />
                            Estrai Testo
                        </>
                    )}
                </button>
            </div>

            <div className="w-full max-w-2xl bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                    <File className="w-6 h-6" />
                    Testo Estratto:
                </h2>
                {text ? (
                    <div className="whitespace-pre-wrap text-gray-900 font-mono bg-gray-100 rounded-md p-4 overflow-auto max-h-96">
                        {text}
                    </div>
                ) : (
                    <p className="text-gray-500">
                        Carica un file PDF per estrarre il testo.
                    </p>
                )}
            </div>

            {extractedDateTime && (
                <div className="w-full max-w-2xl bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                        <File className="w-6 h-6" />
                        Testo Estratto:
                    </h2>
                    <div className="whitespace-pre-wrap text-green-700 font-bold bg-green-50 rounded-md p-4 overflow-auto max-h-40">
                        {extractedDateTime}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;