"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, Trash2, Plus, Save, Printer, Download, Eye, Edit } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const InvoiceGenerator = () => {
  // State for invoice details
  const [invoiceInfo, setInvoiceInfo] = useState({
    invoiceNumber: "001",
    date: new Date().toISOString().substr(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substr(0, 10),
    logo: null,
    currency: "$",
    tax: 10,
  });

  // State for business details
  const [businessInfo, setBusinessInfo] = useState({
    name: "Your Business Name",
    email: "your.email@example.com",
    phone: "(123) 456-7890",
    address: "123 Business St, City, State, ZIP",
  });

  // State for client details
  const [clientInfo, setClientInfo] = useState({
    name: "Client Name",
    email: "client@example.com",
    phone: "(987) 654-3210",
    address: "456 Client Ave, City, State, ZIP",
  });

  // State for invoice items
  const [items, setItems] = useState([
    {
      id: 1,
      description: "Service/Product 1",
      quantity: 1,
      rate: 100,
      amount: 100,
    },
  ]);

  // State for notes
  const [notes, setNotes] = useState("Thank you for your business!");
  
  // State for preview mode
  const [previewMode, setPreviewMode] = useState(false);

  // Currency options
  const currencies = [
    { symbol: "$", code: "USD" },
    { symbol: "€", code: "EUR" },
    { symbol: "£", code: "GBP" },
    { symbol: "¥", code: "JPY" },
		{ symbol: "GH₵", code: "GHS" },
    { symbol: "₹", code: "INR" },
    { symbol: "₦", code: "NGN" },
    { symbol: "R", code: "ZAR" },
    { symbol: "A$", code: "AUD" },
    { symbol: "C$", code: "CAD" },
  ];

  // Ref for file input
  const fileInputRef = useRef(null);
  const invoiceRef = useRef(null);

  // Calculate subtotal, tax amount, and total
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * invoiceInfo.tax) / 100;
  const total = subtotal + taxAmount;

  // Clear placeholders on focus
  const handleFocus = (e) => {
    if (e.target.placeholder && e.target.placeholder !== "Add any notes or payment instructions...") {
      e.target.placeholder = "";
    }
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInvoiceInfo({ ...invoiceInfo, logo: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding a new item
  const addItem = () => {
    const newId =
      items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
    setItems([
      ...items,
      { id: newId, description: "", quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  // Handle removing an item
  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Handle updating an item
  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Auto-calculate amount when quantity or rate changes
          if (field === "quantity" || field === "rate") {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Print invoice
  const printInvoice = async () => {
    // Enter preview mode if not already in it
    if (!previewMode) {
      setPreviewMode(true);
      // Small delay to ensure preview mode is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Add a print-specific stylesheet
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #invoice-content, #invoice-content * {
          visibility: visible;
        }
        #invoice-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    window.print();
    
    // Remove the style after printing
    document.head.removeChild(style);
  };

  // Save invoice as PDF
  const saveInvoice = async () => {
    // Enter preview mode if not already in it
    if (!previewMode) {
      setPreviewMode(true);
      // Small delay to ensure preview mode is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const invoiceElement = invoiceRef.current;
    if (!invoiceElement) return;

    try {
      // Create a clone of the invoice with appropriate styling
      const invoiceClone = invoiceElement.cloneNode(true);
      invoiceClone.style.width = "794px"; // A4 width
      invoiceClone.style.padding = "30px"; // Reduced padding
      invoiceClone.style.backgroundColor = "white";
      invoiceClone.style.fontSize = "14px"; // Ensure consistent font size
      document.body.appendChild(invoiceClone);

      // Remove action buttons from the clone
      const actionButtons = invoiceClone.querySelectorAll(".no-print");
      actionButtons.forEach(button => button.remove());

      // Ensure logo fits properly
      const logo = invoiceClone.querySelector("img[alt='Company logo']");
      if (logo) {
        logo.style.maxHeight = "60px";
        logo.style.maxWidth = "120px";
        logo.style.objectFit = "contain";
      }

      // Make total section more compact
      const totalSection = invoiceClone.querySelector(".w-48");
      if (totalSection) {
        totalSection.style.width = "200px";
        totalSection.style.fontSize = "0.9rem";
      }

      // Render to canvas
      const canvas = await html2canvas(invoiceClone, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794, // Match A4 width
        windowHeight: 1123 // Match A4 height (approximately)
      });
      
      // Remove the clone
      document.body.removeChild(invoiceClone);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = Math.min(297, canvas.height * imgWidth / canvas.width); // Ensure it doesn't exceed A4 height
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice-${invoiceInfo.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    }
  };

  // Download invoice as PDF
  const downloadInvoice = async () => {
    await saveInvoice();
  };

  // Add custom print styles when component mounts
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'invoice-print-styles';
    style.innerHTML = `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        html, body {
          width: 210mm;
          height: 297mm;
        }
        .invoice-container {
          page-break-inside: avoid;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const styleElement = document.getElementById('invoice-print-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Invoice Header with Actions */}
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center no-print">
          <h1 className="text-2xl font-bold">Invoice Generator</h1>
          <div className="flex space-x-3">
            <button
              onClick={togglePreviewMode}
              className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50"
            >
              {previewMode ? (
                <>
                  <Edit className="mr-2 h-5 w-5" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Preview
                </>
              )}
            </button>
            <button
              onClick={printInvoice}
              className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50"
            >
              <Printer className="mr-2 h-5 w-5" />
              Print
            </button>
            <button 
              onClick={downloadInvoice}
              className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </button>
            <button 
              onClick={saveInvoice}
              className="flex items-center bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50"
            >
              <Save className="mr-2 h-5 w-5" />
              Save
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        {previewMode ? (
          /* Preview Mode */
          <div id="invoice-content" ref={invoiceRef} className="p-8 invoice-container">
            {/* Header with Logo and Invoice Info */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h1>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div><span className="font-semibold">Invoice Number:</span> {invoiceInfo.invoiceNumber}</div>
                  <div><span className="font-semibold">Date:</span> {formatDate(invoiceInfo.date)}</div>
                  <div><span className="font-semibold">Due Date:</span> {formatDate(invoiceInfo.dueDate)}</div>
                </div>
              </div>
              <div className="ml-4 flex items-center justify-center">
                {invoiceInfo.logo && (
                  <img
                    src={invoiceInfo.logo}
                    alt="Company logo"
                    className="max-h-16 max-w-32 object-contain"
                    style={{ maxHeight: "60px", maxWidth: "120px" }}
                  />
                )}
              </div>
            </div>

            {/* Business & Client Info - Even More Compact */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 p-3 rounded-md">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">From:</h2>
                <div className="space-y-0.5">
                  <div className="font-semibold">{businessInfo.name}</div>
                  <div>{businessInfo.email}</div>
                  <div>{businessInfo.phone}</div>
                  <div className="whitespace-pre-line text-sm">{businessInfo.address}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Bill To:</h2>
                <div className="space-y-0.5">
                  <div className="font-semibold">{clientInfo.name}</div>
                  <div>{clientInfo.email}</div>
                  <div>{clientInfo.phone}</div>
                  <div className="whitespace-pre-line text-sm">{clientInfo.address}</div>
                </div>
              </div>
            </div>

            {/* Invoice Items - More Compact */}
            <div className="mb-6">
              <h2 className="text-md font-medium text-gray-900 mb-2">Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="py-2 px-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                        Description
                      </th>
                      <th scope="col" className="py-2 px-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                        Qty
                      </th>
                      <th scope="col" className="py-2 px-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                        Rate
                      </th>
                      <th scope="col" className="py-2 px-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-sm text-gray-900 border-r">
                          {item.description}
                        </td>
                        <td className="py-2 px-2 text-sm text-gray-900 text-center border-r">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-2 text-sm text-gray-900 text-right border-r">
                          {invoiceInfo.currency} {item.rate.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-900 text-right">
                          {invoiceInfo.currency} {item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Totals - More Compact */}
            <div className="flex justify-end mb-6">
              <div className="w-48 space-y-1">
                <div className="flex justify-between py-1 border-b text-sm">
                  <span className="font-medium">Subtotal:</span>
                  <span>
                    {invoiceInfo.currency} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b text-sm">
                  <span className="font-medium">Tax ({invoiceInfo.tax}%):</span>
                  <span>
                    {invoiceInfo.currency} {taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-base font-bold">
                  <span>Total:</span>
                  <span>
                    {invoiceInfo.currency} {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes - More Compact */}
            {notes && (
              <div className="border-t pt-3 mt-4">
                <h2 className="text-xs font-medium text-gray-700 mb-1">Notes:</h2>
                <p className="text-xs text-gray-600 whitespace-pre-line">{notes}</p>
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <div id="invoice-content" ref={invoiceRef} className="p-6 invoice-container">
            {/* Invoice Details & Logo */}
            <div className="flex justify-between mb-8">
              <div className="flex-1">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceInfo.invoiceNumber}
                    onChange={(e) =>
                      setInvoiceInfo({
                        ...invoiceInfo,
                        invoiceNumber: e.target.value,
                      })
                    }
                    onFocus={handleFocus}
                    placeholder="Invoice number"
                    className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={invoiceInfo.date}
                      onChange={(e) =>
                        setInvoiceInfo({ ...invoiceInfo, date: e.target.value })
                      }
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={invoiceInfo.dueDate}
                      onChange={(e) =>
                        setInvoiceInfo({
                          ...invoiceInfo,
                          dueDate: e.target.value,
                        })
                      }
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={invoiceInfo.currency}
                      onChange={(e) =>
                        setInvoiceInfo({
                          ...invoiceInfo,
                          currency: e.target.value,
                        })
                      }
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.symbol}>
                          {currency.symbol} ({currency.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="ml-6">
                <div
                  className="h-24 w-40 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
                  {invoiceInfo.logo ? (
                    <img
                      src={invoiceInfo.logo}
                      alt="Company logo"
                      className="h-full w-full object-contain"
                      style={{ maxHeight: "60px", maxWidth: "120px" }}
                    />
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-500 mt-1">Add Logo</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            {/* Business & Client Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-3">From</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessInfo.name}
                      onChange={(e) =>
                        setBusinessInfo({ ...businessInfo, name: e.target.value })
                      }
                      onFocus={handleFocus}
                      placeholder="Enter business name"
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) =>
                        setBusinessInfo({
                          ...businessInfo,
                          email: e.target.value,
                        })
                      }
                      onFocus={handleFocus}
                      placeholder="Enter business email"
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={businessInfo.phone}
                      onChange={(e) =>
                        setBusinessInfo({
                          ...businessInfo,
                          phone: e.target.value,
                        })
                      }
                      onFocus={handleFocus}
                      placeholder="Enter business phone"
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={businessInfo.address}
                      onChange={(e) =>
                        setBusinessInfo({
                          ...businessInfo,
                          address: e.target.value,
                        })
                      }
                      onFocus={handleFocus}
                      placeholder="Enter business address"
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-3">
                  Bill To
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={clientInfo.name}
                      onChange={(e) =>
                        setClientInfo({ ...clientInfo, name: e.target.value })
                      }
                      onFocus={handleFocus}
                      placeholder="Enter client name"
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) =>
                        setClientInfo({ ...clientInfo, email: e.target.value })
                      }
                      onFocus={handleFocus}
                      placeholder="Enter client email"
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={clientInfo.phone}
                      onChange={(e) =>
                        setClientInfo({ ...clientInfo, phone: e.target.value })
                      }
                      onFocus={handleFocus}
                      placeholder="Enter client phone"
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={clientInfo.address}
                      onChange={(e) =>
                        setClientInfo({ ...clientInfo, address: e.target.value })
                      }
                      onFocus={handleFocus}
                      placeholder="Enter client address"
                      className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Rate
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider no-print"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
									<tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          onFocus={handleFocus}
                          placeholder="Item description"
                          className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">
                            {invoiceInfo.currency}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "rate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">
                            {invoiceInfo.currency}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="p-2 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                            readOnly
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right no-print">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addItem}
              className="mt-4 flex items-center text-indigo-600 hover:text-indigo-900 no-print"
            >
              <Plus className="h-5 w-5 mr-1" /> Add Item
            </button>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-1/2 space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Subtotal:</span>
                <span>
                  {invoiceInfo.currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Tax:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={invoiceInfo.tax}
                    onChange={(e) =>
                      setInvoiceInfo({
                        ...invoiceInfo,
                        tax: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="p-1 border border-gray-300 rounded-md w-16 text-right bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                  <span className="ml-1">%</span>
                </div>
                <span>
                  {invoiceInfo.currency} {taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-bold">
                <span>Total:</span>
                <span>
                  {invoiceInfo.currency} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="p-3 border text-black border-gray-300 rounded-md w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              rows="3"
              placeholder="Add any notes or payment instructions..."
            />
          </div>
        </div>)}

				</div>
    </div>
  );
};

export default InvoiceGenerator;