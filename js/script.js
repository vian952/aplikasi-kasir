"use strict";


// ==========================================
// KONFIGURASI
// ==========================================

const STORAGE_KEY = "kasir_sederhana_v2";

const TAX_RATE_DEFAULT = 0;


// ==========================================
// STATE APLIKASI
// ==========================================

let state = {

    products: [],

    transactions: [],

    cart: [],

    discount: 0,

    taxRate: TAX_RATE_DEFAULT

};


// ==========================================
// HELPER
// ==========================================

function $(id) {

    return document.getElementById(id);

}


function rupiah(number) {

    return new Intl.NumberFormat("id-ID", {

        style: "currency",

        currency: "IDR",

        minimumFractionDigits: 0

    }).format(Number(number) || 0);

}


function escapeHTML(text) {

    return String(text).replace(/[&<>'"]/g, function(char) {

        const map = {

            "&": "&amp;",

            "<": "&lt;",

            ">": "&gt;",

            "'": "&#39;",

            '"': "&quot;"

        };

        return map[char];

    });

}


// ==========================================
// LOCAL STORAGE
// ==========================================

function saveState() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify({

            products: state.products,

            transactions: state.transactions

        })

    );

}


function loadState() {

    try {

        const data = localStorage.getItem(STORAGE_KEY);

        if (data) {

            const saved = JSON.parse(data);

            state.products = Array.isArray(saved.products)
                ? saved.products
                : [];

            state.transactions = Array.isArray(saved.transactions)
                ? saved.transactions
                : [];

        }

    } catch (error) {

        console.warn("Data localStorage rusak.", error);

        state.products = [];

        state.transactions = [];

    }


    // Produk awal

    if (state.products.length === 0) {

        state.products = [

            {
                id: 1,
                name: "Indomie Goreng",
                price: 3500,
                stock: 20,
                category: "Makanan"
            },

            {
                id: 2,
                name: "Aqua 600ml",
                price: 3000,
                stock: 15,
                category: "Minuman"
            },

            {
                id: 3,
                name: "Teh Botol",
                price: 5000,
                stock: 10,
                category: "Minuman"
            }

        ];

    }


    saveState();

}


// ==========================================
// HITUNG TOTAL
// ==========================================

function calculateTotals() {

    let subtotal = 0;


    state.cart.forEach(function(item) {

        subtotal += item.price * item.qty;

    });


    let discount = Number(state.discount) || 0;


    if (discount < 0) {

        discount = 0;

    }


    if (discount > subtotal) {

        discount = subtotal;

    }


    let taxRate = Number(state.taxRate) || 0;


    if (taxRate < 0) {

        taxRate = 0;

    }


    if (taxRate > 100) {

        taxRate = 100;

    }


    const taxBase = subtotal - discount;

    const tax = Math.round(
        taxBase * (taxRate / 100)
    );


    const total = taxBase + tax;


    return {

        subtotal: subtotal,

        discount: discount,

        tax: tax,

        total: total

    };

}


// ==========================================
// RENDER SEMUA
// ==========================================

function renderAll() {

    renderDashboard();

    renderProducts();

    renderPOS();

    renderHistory();

    renderReport();

}


// ==========================================
// NAVIGASI
// ==========================================

function showPage(page) {

    document.querySelectorAll(".page").forEach(function(section) {

        section.classList.remove("active");

    });


    const selectedPage = $(page);

    if (selectedPage) {

        selectedPage.classList.add("active");

    }


    document.querySelectorAll(".nav-btn").forEach(function(button) {

        button.classList.toggle(

            "active",

            button.dataset.page === page

        );

    });


    renderAll();

}


// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {

    const revenue = state.transactions.reduce(

        function(total, transaction) {

            return total + transaction.total;

        },

        0

    );


    const totalItems = state.transactions.reduce(

        function(total, transaction) {

            return total +

                transaction.items.reduce(

                    function(sum, item) {

                        return sum + item.qty;

                    },

                    0

                );

        },

        0

    );


    $("dashRevenue").textContent = rupiah(revenue);

    $("dashTransactions").textContent =
        state.transactions.length;

    $("dashItems").textContent = totalItems;

    $("dashProducts").textContent =
        state.products.length;


    const lowStock = state.products.filter(function(product) {

        return product.stock <= 5;

    });


    if (lowStock.length === 0) {

        $("lowStock").innerHTML =
            '<div class="empty">Semua stok aman.</div>';

        return;

    }


    $("lowStock").innerHTML = lowStock.map(

        function(product) {

            return `

                <div class="mini-row">

                    <span>
                        ${escapeHTML(product.name)}
                    </span>

                    <b>
                        ${product.stock}
                    </b>

                </div>

            `;

        }

    ).join("");

}


// ==========================================
// PRODUK
// ==========================================

function renderProducts() {

    const searchInput = $("productSearch");

    const keyword = searchInput
        ? searchInput.value.toLowerCase()
        : "";


    const products = state.products.filter(

        function(product) {

            return (

                product.name
                    .toLowerCase()
                    .includes(keyword)

                ||

                product.category
                    .toLowerCase()
                    .includes(keyword)

            );

        }

    );


    if (products.length === 0) {

        $("productTable").innerHTML = `

            <tr>

                <td colspan="5" class="empty">

                    Produk tidak ditemukan.

                </td>

            </tr>

        `;

        return;

    }


    $("productTable").innerHTML = products.map(

        function(product, index) {

            return `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>

                        <b>
                            ${escapeHTML(product.name)}
                        </b>

                        <small>
                            ${escapeHTML(product.category)}
                        </small>

                    </td>

                    <td>
                        ${rupiah(product.price)}
                    </td>

                    <td>

                        <span
                            class="stock ${
                                product.stock <= 5
                                    ? "low"
                                    : ""
                            }"
                        >

                            ${product.stock}

                        </span>

                    </td>

                    <td>

                        <button
                            class="icon-btn edit"
                            onclick="editProduct(${product.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="icon-btn danger"
                            onclick="deleteProduct(${product.id})"
                        >
                            Hapus
                        </button>

                    </td>

                </tr>

            `;

        }

    ).join("");

}


// ==========================================
// MODAL PRODUK
// ==========================================

function openProduct(id = null) {

    $("productModal").classList.add("show");


    $("productForm").reset();


    $("editId").value = id || "";


    $("modalProductTitle").textContent = id
        ? "Edit Produk"
        : "Tambah Produk";


    if (id) {

        const product = state.products.find(

            function(item) {

                return item.id === id;

            }

        );


        if (!product) {

            return;

        }


        $("pName").value = product.name;

        $("pPrice").value = product.price;

        $("pStock").value = product.stock;

        $("pCategory").value = product.category;

    }

}


function closeModal(id) {

    $(id).classList.remove("show");

}


// ==========================================
// SIMPAN PRODUK
// ==========================================

function saveProduct(event) {

    event.preventDefault();


    const id = Number($("editId").value);

    const name = $("pName").value.trim();

    const price = Number($("pPrice").value);

    const stock = Number($("pStock").value);

    const category =
        $("pCategory").value.trim() || "Umum";


    if (!name) {

        alert("Nama produk harus diisi.");

        return;

    }


    if (price < 0) {

        alert("Harga tidak boleh negatif.");

        return;

    }


    if (stock < 0) {

        alert("Stok tidak boleh negatif.");

        return;

    }


    if (id) {

        const product = state.products.find(

            function(item) {

                return item.id === id;

            }

        );


        if (product) {

            product.name = name;

            product.price = price;

            product.stock = stock;

            product.category = category;

        }

    } else {

        state.products.push({

            id: Date.now(),

            name: name,

            price: price,

            stock: stock,

            category: category

        });

    }


    saveState();


    closeModal("productModal");


    renderAll();

}


// ==========================================
// EDIT PRODUK
// ==========================================

function editProduct(id) {

    openProduct(id);

}


// ==========================================
// HAPUS PRODUK
// ==========================================

function deleteProduct(id) {

    const yakin = confirm(

        "Yakin ingin menghapus produk ini?"

    );


    if (!yakin) {

        return;

    }


    state.products = state.products.filter(

        function(product) {

            return product.id !== id;

        }

    );


    state.cart = state.cart.filter(

        function(item) {

            return item.id !== id;

        }

    );


    saveState();


    renderAll();

}


// ==========================================
// POS
// ==========================================

function renderPOS() {

    const searchInput = $("posSearch");

    const keyword = searchInput
        ? searchInput.value.toLowerCase()
        : "";


    const products = state.products.filter(

        function(product) {

            return product.name
                .toLowerCase()
                .includes(keyword);

        }

    );


    if (products.length === 0) {

        $("posProducts").innerHTML =
            '<div class="empty">Produk tidak ditemukan.</div>';

    } else {

        $("posProducts").innerHTML = products.map(

            function(product) {

                return `

                    <button
                        class="product-card"
                        onclick="addToCart(${product.id})"
                        ${product.stock <= 0 ? "disabled" : ""}
                    >

                        <div class="product-icon">
                            🛍️
                        </div>

                        <div>

                            <b>
                                ${escapeHTML(product.name)}
                            </b>

                            <small>
                                ${escapeHTML(product.category)}
                            </small>

                        </div>

                        <strong>
                            ${rupiah(product.price)}
                        </strong>

                        <span class="product-stock">
                            Stok: ${product.stock}
                        </span>

                    </button>

                `;

            }

        ).join("");

    }


    // CART

    if (state.cart.length === 0) {

        $("cartItems").innerHTML =
            '<div class="empty">Keranjang kosong.</div>';

    } else {

        $("cartItems").innerHTML = state.cart.map(

            function(item) {

                return `

                    <div class="cart-row">

                        <div>

                            <b>
                                ${escapeHTML(item.name)}
                            </b>

                            <small>
                                ${rupiah(item.price)}
                                ×
                                ${item.qty}
                            </small>

                        </div>


                        <div class="qty">

                            <button
                                onclick="changeQty(${item.id}, -1)"
                            >
                                −
                            </button>

                            <b>
                                ${item.qty}
                            </b>

                            <button
                                onclick="changeQty(${item.id}, 1)"
                            >
                                +
                            </button>

                            <button
                                class="remove"
                                onclick="removeCart(${item.id})"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `;

            }

        ).join("");

    }


    const totals = calculateTotals();


    $("subtotal").textContent =
        rupiah(totals.subtotal);


    $("discountValue").textContent =
        rupiah(totals.discount);


    $("taxValue").textContent =
        rupiah(totals.tax);


    $("grandTotal").textContent =
        rupiah(totals.total);


    $("discountInput").value =
        state.discount || 0;


    $("taxInput").value =
        state.taxRate || 0;

}


// ==========================================
// TAMBAH KERANJANG
// ==========================================

function addToCart(id) {

    const product = state.products.find(

        function(item) {

            return item.id === id;

        }

    );


    if (!product) {

        return;

    }


    if (product.stock <= 0) {

        alert("Stok produk habis.");

        return;

    }


    const cartItem = state.cart.find(

        function(item) {

            return item.id === id;

        }

    );


    if (cartItem) {

        if (cartItem.qty >= product.stock) {

            alert("Jumlah melebihi stok.");

            return;

        }


        cartItem.qty++;

    } else {

        state.cart.push({

            id: product.id,

            name: product.name,

            price: product.price,

            qty: 1

        });

    }


    renderPOS();

}


// ==========================================
// JUMLAH BARANG
// ==========================================

function changeQty(id, change) {

    const cartItem = state.cart.find(

        function(item) {

            return item.id === id;

        }

    );


    const product = state.products.find(

        function(item) {

            return item.id === id;

        }

    );


    if (!cartItem || !product) {

        return;

    }


    if (
        change > 0 &&
        cartItem.qty >= product.stock
    ) {

        alert("Jumlah melebihi stok.");

        return;

    }


    cartItem.qty += change;


    if (cartItem.qty <= 0) {

        state.cart = state.cart.filter(

            function(item) {

                return item.id !== id;

            }

        );

    }


    renderPOS();

}


// ==========================================
// HAPUS DARI KERANJANG
// ==========================================

function removeCart(id) {

    state.cart = state.cart.filter(

        function(item) {

            return item.id !== id;

        }

    );


    renderPOS();

}


// ==========================================
// UPDATE DISKON / PAJAK
// ==========================================

function updateTotals() {

    state.discount =
        Math.max(
            Number($("discountInput").value) || 0,
            0
        );


    state.taxRate =
        Math.min(
            Math.max(
                Number($("taxInput").value) || 0,
                0
            ),
            100
        );


    renderPOS();

}


// ==========================================
// KOSONGKAN KERANJANG
// ==========================================

function clearCart() {

    if (state.cart.length === 0) {

        return;

    }


    if (!confirm("Kosongkan keranjang?")) {

        return;

    }


    state.cart = [];

    state.discount = 0;

    state.taxRate = TAX_RATE_DEFAULT;


    renderPOS();

}


// ==========================================
// PEMBAYARAN
// ==========================================

function openPayment() {

    if (state.cart.length === 0) {

        alert("Keranjang masih kosong.");

        return;

    }


    const totals = calculateTotals();


    $("payTotal").textContent =
        rupiah(totals.total);


    $("payAmount").value = "";


    $("payChange").textContent =
        rupiah(0);


    $("paymentModal").classList.add("show");


    setTimeout(function() {

        $("payAmount").focus();

    }, 100);

}


// ==========================================
// HITUNG KEMBALIAN
// ==========================================

function calcChange() {

    const payment =
        Number($("payAmount").value) || 0;


    const totals = calculateTotals();


    if (payment >= totals.total) {

        $("payChange").textContent =
            rupiah(payment - totals.total);

    } else {

        $("payChange").textContent =
            "Kurang " +
            rupiah(totals.total - payment);

    }

}


// ==========================================
// SELESAIKAN TRANSAKSI
// ==========================================

function completeTransaction() {

    const payment =
        Number($("payAmount").value) || 0;


    const totals = calculateTotals();


    if (payment < totals.total) {

        alert("Pembayaran masih kurang.");

        return;

    }


    // cek stok

    for (const item of state.cart) {

        const product = state.products.find(

            function(product) {

                return product.id === item.id;

            }

        );


        if (!product || product.stock < item.qty) {

            alert(
                "Stok berubah. Silakan cek kembali."
            );

            return;

        }

    }


    // kurangi stok

    state.cart.forEach(function(item) {

        const product = state.products.find(

            function(product) {

                return product.id === item.id;

            }

        );


        product.stock -= item.qty;

    });


    // buat transaksi

    const transaction = {

        id: "TRX-" + Date.now(),

        date: new Date().toISOString(),

        items: state.cart.map(function(item) {

            return {

                ...item

            };

        }),

        subtotal: totals.subtotal,

        discount: totals.discount,

        tax: totals.tax,

        taxRate: state.taxRate,

        total: totals.total,

        payment: payment,

        change: payment - totals.total

    };


    state.transactions.unshift(transaction);


    state.cart = [];

    state.discount = 0;

    state.taxRate = TAX_RATE_DEFAULT;


    saveState();


    closeModal("paymentModal");


    renderAll();


    alert("Transaksi berhasil disimpan.");

}


// ==========================================
// RIWAYAT
// ==========================================

function renderHistory() {

    const searchInput =
        $("historySearch");


    const keyword = searchInput
        ? searchInput.value.toLowerCase()
        : "";


    const transactions =
        state.transactions.filter(

            function(transaction) {

                return transaction.id
                    .toLowerCase()
                    .includes(keyword);

            }

        );


    if (transactions.length === 0) {

        $("historyTable").innerHTML = `

            <tr>

                <td colspan="5" class="empty">

                    Belum ada transaksi.

                </td>

            </tr>

        `;

        return;

    }


    $("historyTable").innerHTML =
        transactions.map(

            function(transaction) {

                const totalItems =
                    transaction.items.reduce(

                        function(total, item) {

                            return total + item.qty;

                        },

                        0

                    );


                return `

                    <tr>

                        <td>
                            <b>${transaction.id}</b>
                        </td>

                        <td>
                            ${new Date(
                                transaction.date
                            ).toLocaleString("id-ID")}
                        </td>

                        <td>
                            ${totalItems}
                        </td>

                        <td>
                            <b>
                                ${rupiah(transaction.total)}
                            </b>
                        </td>

                        <td>

                            <button
                                class="icon-btn edit"
                                onclick="viewTransaction('${transaction.id}')"
                            >
                                Detail
                            </button>

                            <button
                                class="icon-btn"
                                onclick="printReceipt('${transaction.id}')"
                            >
                                Struk
                            </button>

                        </td>

                    </tr>

                `;

            }

        ).join("");

}


// ==========================================
// DETAIL TRANSAKSI
// ==========================================

function viewTransaction(id) {

    const transaction =
        state.transactions.find(

            function(item) {

                return item.id === id;

            }

        );


    if (!transaction) {

        return;

    }


    $("detailContent").innerHTML = `

        <div class="receipt-head">

            <h2>
                Detail Transaksi
            </h2>

            <p>
                ${transaction.id}
                <br>

                ${new Date(
                    transaction.date
                ).toLocaleString("id-ID")}
            </p>

        </div>


        ${transaction.items.map(function(item) {

            return `

                <div class="detail-line">

                    <span>
                        ${escapeHTML(item.name)}
                        × ${item.qty}
                    </span>

                    <b>
                        ${rupiah(
                            item.price * item.qty
                        )}
                    </b>

                </div>

            `;

        }).join("")}


        <hr>


        <div class="detail-line">

            <span>
                Subtotal
            </span>

            <b>
                ${rupiah(transaction.subtotal)}
            </b>

        </div>


        <div class="detail-line">

            <span>
                Diskon
            </span>

            <b>
                -${rupiah(transaction.discount)}
            </b>

        </div>


        <div class="detail-line">

            <span>
                Pajak
            </span>

            <b>
                ${rupiah(transaction.tax)}
            </b>

        </div>


        <div class="detail-line total-line">

            <span>
                Total
            </span>

            <b>
                ${rupiah(transaction.total)}
            </b>

        </div>


        <div class="detail-line">

            <span>
                Bayar
            </span>

            <b>
                ${rupiah(transaction.payment)}
            </b>

        </div>


        <div class="detail-line">

            <span>
                Kembalian
            </span>

            <b>
                ${rupiah(transaction.change)}
            </b>

        </div>

    `;


    $("detailModal").classList.add("show");

}


// ==========================================
// CETAK STRUK
// ==========================================

function printReceipt(id) {

    const transaction =
        state.transactions.find(

            function(item) {

                return item.id === id;

            }

        );


    if (!transaction) {

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=420,height=700"
        );


    if (!printWindow) {

        alert(
            "Popup diblokir browser. " +
            "Izinkan popup untuk mencetak struk."
        );

        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${transaction.id}
            </title>

            <style>

                body {

                    font-family: Arial;

                    padding: 20px;

                    max-width: 360px;

                    margin: auto;

                }

                h2 {

                    text-align: center;

                }

                .line {

                    display: flex;

                    justify-content: space-between;

                    margin: 8px 0;

                }

                hr {

                    border: 0;

                    border-top:
                        1px dashed #777;

                }

                .center {

                    text-align: center;

                }

            </style>

        </head>


        <body>

            <h2>
                KASIRKU
            </h2>


            <p class="center">

                ${transaction.id}

                <br>

                ${new Date(
                    transaction.date
                ).toLocaleString("id-ID")}

            </p>


            <hr>


            ${transaction.items.map(function(item) {

                return `

                    <div class="line">

                        <span>
                            ${escapeHTML(item.name)}
                            x${item.qty}
                        </span>

                        <span>
                            ${rupiah(
                                item.price *
                                item.qty
                            )}
                        </span>

                    </div>

                `;

            }).join("")}


            <hr>


            <div class="line">

                <span>
                    Subtotal
                </span>

                <b>
                    ${rupiah(
                        transaction.subtotal
                    )}
                </b>

            </div>


            <div class="line">

                <span>
                    Diskon
                </span>

                <b>
                    -${rupiah(
                        transaction.discount
                    )}
                </b>

            </div>


            <div class="line">

                <span>
                    Pajak
                </span>

                <b>
                    ${rupiah(
                        transaction.tax
                    )}
                </b>

            </div>


            <div class="line">

                <span>
                    Total
                </span>

                <b>
                    ${rupiah(
                        transaction.total
                    )}
                </b>

            </div>


            <div class="line">

                <span>
                    Bayar
                </span>

                <b>
                    ${rupiah(
                        transaction.payment
                    )}
                </b>

            </div>


            <div class="line">

                <span>
                    Kembali
                </span>

                <b>
                    ${rupiah(
                        transaction.change
                    )}
                </b>

            </div>


            <p class="center">

                Terima kasih

            </p>


            <script>

                window.onload = function() {

                    window.print();

                };

            <\/script>

        </body>

        </html>

    `);


    printWindow.document.close();

}


// ==========================================
// HAPUS SEMUA RIWAYAT
// ==========================================

function deleteAllHistory() {

    if (state.transactions.length === 0) {

        alert("Belum ada riwayat transaksi.");

        return;

    }


    const yakin = confirm(
        "Hapus semua riwayat transaksi?"
    );


    if (!yakin) {

        return;

    }


    state.transactions = [];


    saveState();


    renderAll();

}


// ==========================================
// LAPORAN
// ==========================================

function renderReport() {

    const revenue =
        state.transactions.reduce(

            function(total, transaction) {

                return total + transaction.total;

            },

            0

        );


    const totalItems =
        state.transactions.reduce(

            function(total, transaction) {

                return total +

                    transaction.items.reduce(

                        function(sum, item) {

                            return sum + item.qty;

                        },

                        0

                    );

            },

            0

        );


    $("reportRevenue").textContent =
        rupiah(revenue);


    $("reportTx").textContent =
        state.transactions.length;


    $("reportItems").textContent =
        totalItems;


    // produk terlaris

    const sales = {};


    state.transactions.forEach(

        function(transaction) {

            transaction.items.forEach(

                function(item) {

                    if (!sales[item.name]) {

                        sales[item.name] = 0;

                    }


                    sales[item.name] += item.qty;

                }

            );

        }

    );


    const bestProducts =
        Object.entries(sales)

            .sort(function(a, b) {

                return b[1] - a[1];

            })

            .slice(0, 5);


    if (bestProducts.length === 0) {

        $("bestProducts").innerHTML =
            '<div class="empty">Belum ada penjualan.</div>';

        return;

    }


    $("bestProducts").innerHTML =
        bestProducts.map(

            function(item, index) {

                return `

                    <div class="mini-row">

                        <span>
                            ${index + 1}.
                            ${escapeHTML(item[0])}
                        </span>

                        <b>
                            ${item[1]}
                            terjual
                        </b>

                    </div>

                `;

            }

        ).join("");

}


// ==========================================
// RESET DATA
// ==========================================

function resetData() {

    const yakin = confirm(

        "Reset semua data ke data awal?"

    );


    if (!yakin) {

        return;

    }


    localStorage.removeItem(STORAGE_KEY);


    location.reload();

}


// ==========================================
// TANGGAL
// ==========================================

function tampilkanTanggal() {

    const sekarang = new Date();


    $("currentDate").textContent =
        sekarang.toLocaleDateString(

            "id-ID",

            {

                weekday: "long",

                day: "numeric",

                month: "long",

                year: "numeric"

            }

        );

}


// ==========================================
// SAAT WEBSITE DIBUKA
// ==========================================

window.addEventListener(

    "DOMContentLoaded",

    function() {

        loadState();


        tampilkanTanggal();


        // navigasi

        document
            .querySelectorAll(".nav-btn")
            .forEach(function(button) {

                button.addEventListener(

                    "click",

                    function() {

                        showPage(
                            button.dataset.page
                        );

                    }

                );

            });


        // form produk

        $("productForm")
            .addEventListener(
                "submit",
                saveProduct
            );


        // pencarian produk

        $("productSearch")
            .addEventListener(
                "input",
                renderProducts
            );


        // pencarian kasir

        $("posSearch")
            .addEventListener(
                "input",
                renderPOS
            );


        // pencarian riwayat

        $("historySearch")
            .addEventListener(
                "input",
                renderHistory
            );


        // diskon

        $("discountInput")
            .addEventListener(
                "input",
                updateTotals
            );


        // pajak

        $("taxInput")
            .addEventListener(
                "input",
                updateTotals
            );


        // pembayaran

        $("payAmount")
            .addEventListener(
                "input",
                calcChange
            );


        renderAll();

    }

);