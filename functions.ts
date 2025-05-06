import puppeteer from "puppeteer";
import * as proxyChain from "proxy-chain";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface FormularioData {
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
  tipoPessoa: "PF" | "PJ";
  nomeCompleto: string;
  valor: string;
  address?: string;
}

export interface TransactionResult {
  payloadPix: string;
  transactionId: string;
  transactionRid: string;
  status?: string;
  error?: string;
  explorerUrl?: string;
}

async function getProxy() {
  const user = "jzvdevlw";
  const password = "3vb0ksClAMZcKo";

  let arrayProxy = [
    {
      ip: "104.239.40.169",
      port: "6788",
    },
    {
      ip: "104.253.212.118",
      port: "5528",
    },
    {
      ip: "185.15.179.67",
      port: "6033",
    },
    {
      ip: "45.39.15.109",
      port: "6539",
    },
    {
      ip: "104.143.229.38",
      port: "5966",
    },
    {
      ip: "45.94.136.69",
      port: "6845",
    },
    {
      ip: "104.252.44.134",
      port: "6064",
    },
    {
      ip: "168.199.227.92",
      port: "6871",
    },
    {
      ip: "172.98.178.74",
      port: "6147",
    },
    {
      ip: "191.101.121.159",
      port: "6433",
    },
    {
      ip: "104.253.55.106",
      port: "5536",
    },
    {
      ip: "191.101.94.159",
      port: "6129",
    },
    {
      ip: "168.199.132.81",
      port: "6153",
    },
    {
      ip: "172.98.169.170",
      port: "6594",
    },
    {
      ip: "45.39.15.93",
      port: "6523",
    },
    {
      ip: "147.185.250.14",
      port: "6800",
    },
    {
      ip: "88.218.105.134",
      port: "5898",
    },
    {
      ip: "191.101.94.37",
      port: "6007",
    },
    {
      ip: "104.252.44.30",
      port: "5960",
    },
    {
      ip: "45.94.136.209",
      port: "6985",
    },
    {
      ip: "168.199.186.188",
      port: "6611",
    },
    {
      ip: "104.143.229.3",
      port: "5931",
    },
    {
      ip: "191.101.121.63",
      port: "6337",
    },
  ];

  let randomProxy = arrayProxy[Math.floor(Math.random() * arrayProxy.length)];
  const ip = randomProxy.ip;
  const port = randomProxy.port;

  return proxyChain.anonymizeProxy(`http://${user}:${password}@${ip}:${port}`);
}

export async function criarTransacao4p(
  dados: FormularioData,
  callBackGetResult: (data: any) => void,
  callbackUpdateStatus: (transactionId: string, status: string, data: any) => void
): Promise<any> {
  let finished = false;
  let initialTime = Date.now();

  // // TESTE
  // callBackGetResult({
  //   payloadPix: "teste",
  //   transactionId: "teste",
  //   transactionRid: "teste",
  //   status: "teste",
  // });

  // await sleep(4000);
  // callbackUpdateStatus("teste", "teste", {
  //   payloadPix: "teste",
  //   transactionId: "teste",
  //   transactionRid: "teste",
  //   status: "teste",
  // });

  // return;

  // Inicializa o navegador
  const browser = await puppeteer.launch({
    headless: true, // Definido como false para visualizar o navegador em ação
    defaultViewport: null,
    args: [
      "--start-maximized",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      // `--proxy-server=${await getProxy()}`,
    ], // Inicia o navegador maximizado
  });

  let payloadPix = "";
  let transactionId = "";
  let transactionRid = "";
  let status = "";
  let error = "";

  try {
    // Abre uma nova página
    const page = await browser.newPage();

    page.setCacheEnabled(false);

    async function onClose() {
      await browser.close();
    }

    // Configura a interceptação das requisições de rede
    await page.setRequestInterception(true);

    // Intercepta as requisições e respostas
    page.on("request", (request) => {
      request.continue();
    });

    page.on("response", async (response) => {
      const url = response.url();
      const request = response.request(); // pega o request relacionado à response
      const method = request.method(); // pega o método HTTP

      if (method === "OPTIONS") {
        return;
      }

      // Intercepta a resposta da criação da transação
      if (url.includes("v1/p2p/transaction/create/")) {
        try {
          const responseData = await response.json();

          if (responseData?.info?.data?.payload_pix) {
            payloadPix = responseData.info.data.payload_pix;
          } else if (responseData?.info?.message) {
            error = "Erro ao processar resposta da API";
          }
        } catch (error) {
          console.error("Erro ao processar resposta da API:", error);
          error = "Erro ao processar resposta da API";
        }
      }

      // Intercepta a resposta do status da transação
      if (url.includes("v1/p2p/transaction/status")) {
        let requestData = JSON.parse(request.postData());
        transactionId = requestData.id;
        transactionRid = requestData.rid;

        const responseData = await response.json();
        if (responseData?.info?.data?.status) {
          callbackUpdateStatus(transactionId, responseData?.info?.data?.status);
          if (
            responseData?.info?.data?.status == "canceled" ||
            responseData?.info?.data?.status == "success"
          ) {
            finished = true;
          }
        }
      }

      // // Intercepta a resposta que contém o ID e RID
      // if (url.includes("v1/p2p/transaction/")) {
      //   try {
      //     const responseData = await response.json();
      //     if (responseData.id && responseData.rid) {
      //       transactionId = responseData.id;
      //       transactionRid = responseData.rid;
      //       console.log("\n==== IDENTIFICADORES DA TRANSAÇÃO ====");
      //       console.log("ID:", transactionId);
      //       console.log("RID:", transactionRid);
      //       console.log("============================\n");

      //       // Fecha o navegador após obter os identificadores
      //       await browser.close();
      //       console.log("Navegador fechado após obter os identificadores.");
      //     }
      //   } catch (error) {
      //     console.error("Erro ao processar resposta com ID e RID:", error);
      //   }
      // }
    });

    // Navega para o site alvo
    console.log("Acessando o site...");
    await page.goto("https://4p.finance/comprar-criptomoedas-com-pix", {
      waitUntil: "networkidle2",
    });



    // Aguarda um momento para a página carregar completamente
    await sleep(2000);
    
    // Busca e clica no botão que contém "Arbitrum"
    console.log("Buscando botão com 'Arbitrum' e clicando...");
    await page.evaluate(() => {
      const botoes = Array.from(document.querySelectorAll("button"));
      const botaoArbitrum = botoes.find((botao) => 
        botao.textContent.includes("ETH")
      );
      if (botaoArbitrum) {
        console.log("Botão Arbitrum encontrado, clicando...");
        botaoArbitrum.click();
      } else {
        console.log("Botão Arbitrum não encontrado");
      }
    });
    
    // Aguarda um momento após clicar no botão
    await sleep(1000);

    await page.evaluate(() => {
      const botoes = Array.from(document.querySelectorAll("button"));
      const botaoArbitrum = botoes.find((botao) => 
        botao.textContent.includes("USDC")
      );
      if (botaoArbitrum) {
        console.log("Botão Arbitrum encontrado, clicando...");
        botaoArbitrum.click();
      } else {
        console.log("Botão Arbitrum não encontrado");
      }
    });

    await page.waitForSelector("#amountFrom");
    await page.evaluate( () => document.getElementById("amountFrom").value = "")
    await page.type(
      "#amountFrom",
      parseInt(Number(dados.valor) * 100).toString()
    );

    await sleep(1000);

    return;

    console.log(
      'Aguardando até que o texto "calculando..." não esteja mais na tela...'
    );
    await page.waitForFunction(
      () => !document.body.textContent.includes("Calculando...")
    );
    await sleep(1000);

    await page.evaluate(() => {
      const botoes = Array.from(document.querySelectorAll("button"));
      const botaoArbitrum = botoes.find((botao) => 
        botao.textContent.includes("Prosseguir")
      );
      if (botaoArbitrum) {
        console.log("Botão Arbitrum encontrado, clicando...");
        botaoArbitrum.click();
      } else {
        console.log("Botão Arbitrum não encontrado");
      }
    });


    await sleep(1000);

    await page.type('input[placeholder*="nome"]', dados.nomeCompleto);
    await sleep(1000);
    await page.type('input[placeholder*="e-mail"]', dados.email);
    await sleep(1000);
    await page.type('input[placeholder*="CPF"]', dados.cpf);
    await sleep(1000);
    await page.type('input[placeholder*="carteira"]', dados.address);
    await page.click('#terms_policies');
    await sleep(1000);

    await page.evaluate(() => {
      const botoes = Array.from(document.querySelectorAll("button"));
      const botaoArbitrum = botoes.find((botao) => 
        botao.textContent.includes("Confirmar dados")
      );
      if (botaoArbitrum) {
        console.log("Botão Arbitrum encontrado, clicando...");
        botaoArbitrum.click();
      } else {
        console.log("Botão Arbitrum não encontrado");
      }
    });

    await sleep(1000);

    await page.evaluate(() => {
      const botoes = Array.from(document.querySelectorAll("button"));
      const botaoArbitrum = botoes.find((botao) => 
        botao.textContent.includes("Solicitar conversão")
      );
      if (botaoArbitrum) {
        console.log("Botão Arbitrum encontrado, clicando...");
        botaoArbitrum.click();
      } else {
        console.log("Botão Arbitrum não encontrado");
      }
    });

    // Aguardando a resposta da API e obtendo o payload PIX
    console.log("Aguardando resposta da API para obter o código PIX...");

    // Aguarda até que o payload PIX seja obtido ou timeout após 30 segundos
    const maxWaitTime = 30000;
    const startTime = Date.now();

    while (!payloadPix && Date.now() - startTime < maxWaitTime) {
      await sleep(1000);
      console.log("Aguardando payload PIX...");
      if (error) {
        await onClose();
        throw new Error(error);
      }
    }

    if (!payloadPix) {
      console.log("Não foi possível obter o payload PIX no tempo esperado.");
      await onClose();
      throw new Error("Erro ao gerar Pix, timeout");
    }

    // Aguarda até que os identificadores sejam obtidos ou timeout após 30 segundos
    const maxWaitTimeForIds = 30000;
    const startTimeForIds = Date.now();

    while (
      (!transactionId || !transactionRid) &&
      Date.now() - startTimeForIds < maxWaitTimeForIds
    ) {
      await sleep(1000);
    }

    if (!transactionId || !transactionRid) {
      await onClose();
      throw new Error("Erro ao gerar Pix, timeout status");
    }
  } catch (error) {
    return callBackGetResult({
      error: error.message,
    });
  } finally {
  }

  callBackGetResult({
    payloadPix,
    transactionId,
    transactionRid,
    status,
  });

  while (1) {
    await sleep(5000);
    if (Date.now() - initialTime > 2.5 * 60 * 60 * 1000 || finished) {
      if (browser && browser.isConnected()) {
        await browser.close();
        console.log("Navegador fechado.");
      }
      return;
    }
  }
}
