async function main() {
  console.log("Calling sincronizar-planilha API...");
  try {
    const res = await fetch("http://localhost:3000/api/financeiro/sincronizar-planilha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        month: "Março",
        year: "26"
      })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error calling API:", err);
  }
}

main();
