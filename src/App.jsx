import React, { useState, useEffect, useRef } from 'react';
import { Loader2, File, FilePlus } from 'lucide-react';

const App = () => {
    const [image, setImage] = useState(null);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [extractedDateTime, setExtractedDateTime] = useState(''); // Nuovo stato per la data/ora estratta
    const tesseractWorkerRef = useRef(null);

    // Inizializza Tesseract.js
    const initializeTesseract = async () => {
        if (!tesseractWorkerRef.current) {
            try {
                const { createWorker } = await import('tesseract.js');
                tesseractWorkerRef.current = await createWorker();
            } catch (error) {
                console.error("Failed to initialize Tesseract.js:", error);
                setLoading(false);
                return; // Importante: esci dalla funzione in caso di errore
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

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setImage(file);
            setText('');
        }
    };

    const handleOcr = async () => {
        if (!image) {
            alert('Si prega di selezionare un\'immagine.'); // Usa un alert semplice per brevità
            return;
        }

        if (!tesseractWorkerRef.current) {
            alert('Tesseract.js non è stato inizializzato.');
            return;
        }

        setLoading(true);
        try {
            const { data: { text } } = await tesseractWorkerRef.current.recognize(image);
            extractSpecificData(text);
            setText(text);
        } catch (error) {
            console.error("Errore durante l'OCR:", error);
            setText('Errore durante il riconoscimento del testo.'); // Messaggio di errore semplificato
        } finally {
            setLoading(false);
        }
    };

    const extractSpecificData = (ocrText) => {
        const regex = /AppOCR(?:.{0,50})?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s+\d{1,2}:\d{2})/i;
        const match = ocrText.match(regex);

        if (match && match[1]) {
            setExtractedDateTime(match[1]);
        } else {
            setExtractedDateTime('Nessuna data/ora specifica trovata vicino alla parola indicata.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start pt-16">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">OCR App</h1>

            <div className="mb-6 w-full max-w-md">
                <input
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                <label htmlFor="imageInput" className="block mt-2 text-sm text-gray-500">
                    Carica un'immagine (JPG, PNG, GIF)
                </label>
            </div>

            {image && (
                <div className="mb-6 w-full max-w-md">
                    <div className="relative border-2 border-dashed border-gray-400 rounded-lg p-4 bg-white">
                        <img
                            src={URL.createObjectURL(image)}
                            alt="Anteprima"
                            className="w-full max-h-64 object-contain rounded-md"
                        />
                    </div>
                </div>
            )}

            <div className="flex gap-4 mb-8">
                <button
                    onClick={handleOcr}
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
                        {image ? "Premi 'Estrai Testo' per iniziare l'OCR." : "Carica un'immagine per estrarre il testo."}
                    </p>
                )}
            </div>

            {extractedDateTime && (
                <div className="w-full max-w-2xl bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                        <File className="w-6 h-6" />
                        Data/Ora Estratta:
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
