"use client";

import { useEffect, useState } from 'react';

interface Product {
    id?: string;
    name: string;
    price: number;
    stock: number;
}

export default function Home() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:8080/api/products')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch data. Check if the backend is running!');
                }
                return response.json();
            })
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', color: 'black', background: 'white', minHeight: '100vh' }}>
            <h1>📦 JaStip Online Nasional (JSON) Catalog</h1>

            {loading && <p>⏳ Loading data from the database...</p>}

            {error && (
                <div style={{ background: '#ffebee', padding: '10px', color: 'red', borderRadius: '5px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {!loading && !error && products.length === 0 && (
                <p>Database is empty. No products have been added yet.</p>
            )}

            {!loading && !error && products.length > 0 && (
                <table border={1} style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px', color: 'black' }}>
                    <thead style={{ background: '#f4f4f4', textAlign: 'left' }}>
                    <tr>
                        <th style={{ padding: '10px' }}>Product Name</th>
                        <th style={{ padding: '10px' }}>Price (IDR)</th>
                        <th style={{ padding: '10px' }}>Remaining Stock</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.map((product, index) => (
                        <tr key={index}>
                            <td style={{ padding: '10px' }}>{product.name}</td>
                            <td style={{ padding: '10px' }}>
                                {product.price.toLocaleString('id-ID')}
                            </td>
                            <td style={{ padding: '10px' }}>{product.stock}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}