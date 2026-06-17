// js/storage.js
// Data model, defaults, and localStorage CRUD

const STORAGE_KEY = 'xuxuMenu_data';

export const DEFAULT_DATA = {
  title: 'Cardápio',
  products: [
    {
      id: 'pratoDia',
      name: 'Prato do Dia',
      price: '20,00',
      ingredients: ['Arroz', 'Feijão', 'Macarrão', 'Farofa', 'Batata Frita', 'Vinagrete']
    },
    {
      id: 'picadinho',
      name: 'Picadinho',
      subtitle: 'da Alegria',
      price: '28,00',
      items: ['Macarrão Acebolado', 'Linguiça de frango', 'Tiras de filé', 'Barbecue']
    },
    {
      id: 'parmegiana',
      name: 'Parmegiana',
      variants: [
        { label: 'Frango', price: '25' },
        { label: 'Carne', price: '28' }
      ],
      items: ['Macarrão alho óleo', 'Molho especial', 'Manjericão', 'Mussarela']
    },
    {
      id: 'salada',
      name: 'Salada',
      variants: [
        { label: 'Frango', price: '20' },
        { label: 'Carne', price: '23' },
        { label: 'Tilápia', price: '26' }
      ],
      ingredientsTitle: 'Ingredientes da Salada',
      ingredients: ['Milho', 'Alface', 'Rúcula', 'Tomate', 'Beterraba', 'Cenoura']
    },
    {
      id: 'luis',
      name: 'Luís',
      variants: [
        { label: 'Frango', price: '23' },
        { label: 'Carne', price: '26' },
        { label: 'Tilápia', price: '28' }
      ],
      items: ['Arroz', 'Feijão', 'Salada', 'Molho']
    },
    {
      id: 'barca',
      name: 'Barça',
      variants: [
        { label: 'Frango', price: '30' },
        { label: 'Carne', price: '30' },
        { label: 'Tilápia', price: '30' }
      ],
      items: ['Arroz', 'Salada', 'Fritas', 'Molho', 'Anel de Cebola']
    }
  ],
  footer: {
    title: 'Monte seu Prato',
    items: [
      { name: 'Filé de Tilápia', price: '15,00' },
      { name: 'Filé de Frango', price: '13,00' },
      { name: 'Filé de Carne', price: '15,00' },
      { name: 'Linguiça Fina', price: '13,00' },
      { name: 'Farofa', price: '4,00' },
      { name: 'Cebola', price: '4,00' },
      { name: 'Vinagrete', price: '5,00' },
      { name: 'Salada', price: '7,00' },
      { name: 'Molhos', price: '2,00' },
      { name: 'Arroz Branco', price: '4,00' },
      { name: 'Feijão Carioca', price: '4,00' },
      { name: 'Macarrão', price: '7,00' },
      { name: 'Fritas Individual', price: '8,00' },
      { name: 'Fritas Cone', price: '15,00' },
      { name: 'Ovo Frito', price: '2,00' }
    ]
  }
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function getData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return deepClone(DEFAULT_DATA);
    }
  }
  return deepClone(DEFAULT_DATA);
}

export function setData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getProduct(id) {
  const data = getData();
  return data.products.find(p => p.id === id);
}

// Image storage (separate keys to avoid size issues)
const IMAGE_KEYS = {
  pratoDia: 'img_pratoDia',
  picadinho: 'img_picadinho',
  parmegiana: 'img_parmegiana',
  salada: 'img_salada',
  luis: 'img_luis',
  barca: 'img_barca'
};

export function getImageKey(productId) {
  return IMAGE_KEYS[productId] || null;
}

export function getImage(productId) {
  const key = getImageKey(productId);
  return key ? localStorage.getItem(key) : null;
}

export function saveImage(productId, dataUrl) {
  const key = getImageKey(productId);
  if (key) localStorage.setItem(key, dataUrl);
}

export function fileToDataUrl(file, maxLado = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h) {
          if (w > maxLado) { h *= maxLado / w; w = maxLado; }
        } else {
          if (h > maxLado) { w *= maxLado / h; h = maxLado; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
