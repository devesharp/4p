import puppeteer from "puppeteer";
import * as proxyChain from "proxy-chain";
import { proxies } from "./proxies";

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

  let randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
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
    headless: false, // Definido como false para visualizar o navegador em ação
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
    
    // Verifica se o modal está presente e clica no botão "Estou ciente. Continuar"
    const modalSelector = 'button:contains("Estou ciente. Continuar")';
    const modalExists = await page.evaluate((selector) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some((button) =>
        button.textContent.includes("Estou ciente")
      );
    }, modalSelector);

    if (modalExists) {
      console.log(
        'Modal encontrado. Clicando no botão "Estou ciente. Continuar"...'
      );
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const targetButton = buttons.find((button) =>
          button.textContent.includes("Estou ciente. Continuar")
        );
        if (targetButton) targetButton.click();
      });
      await sleep(2000); // Aguarda o modal fechar
    } else {
      console.log("Modal não encontrado ou já fechado.");
    }


    // Busca e clica no botão que contém "Arbitrum"
    console.log('Abrindo a tela de seleção de criptomoeda...');
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

    console.log('Selecionando a criptomoeda USDC...');
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

    console.log('Preenchendo o valor da transação...');
    await page.waitForSelector("#amountFrom");
    await page.evaluate( () => document.getElementById("amountFrom").value = "")
    await page.type(
      "#amountFrom",
      parseInt(Number(dados.valor) * 100).toString()
    );

    await sleep(1000);

    console.log(
      'Aguardando até que o texto "calculando..." não esteja mais na tela...'
    );
    await page.waitForFunction(
      () => !document.body.textContent.includes("Calculando...")
    );
    await sleep(1000);

    console.log('Clicando no botão "Prosseguir"...');
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

    console.log('Preenchendo os dados do comprador...');
    await page.type('input[placeholder*="nome"]', dados.nomeCompleto);
    await sleep(1000);

    console.log('Preenchendo os dados do comprador...');
    await page.type('#phone', dados.telefone.replace(/\D/g, ''));
    await sleep(1000);

    console.log('Preenchendo o e-mail do comprador...');
    await page.type('input[placeholder*="e-mail"]', dados.email);
    await sleep(1000);

    if (dados.tipoPessoa === "PF") {
    console.log('Preenchendo o CPF do comprador...');
      await page.type('input[placeholder*="CPF"]', dados.cpf);
      await sleep(1000);
    } else {
      await page.evaluate(() => {
        const botoes = Array.from(document.querySelectorAll("button"));
        const botaoArbitrum = botoes.find((botao) => 
          botao.textContent.includes("Usar CPF")
        );
  
        if (botaoArbitrum) {
          console.log("Botão Arbitrum encontrado, clicando...");
          botaoArbitrum.click();
        } else {
          console.log("Botão Arbitrum não encontrado");
        }
      });
  
      await sleep(1000);
      console.log('Clicando no botão "Usar CNPJ"...');
      await page.evaluate(() => {
        const botoes = Array.from(document.querySelectorAll("span"));
        const botaoArbitrum = botoes.find((botao) => 
          botao.textContent.includes("Usar CNPJ")
        );
        
        if (botaoArbitrum) {
          console.log("Botão Arbitrum encontrado, clicando...");
          botaoArbitrum.click();
        } else {
          console.log("Botão Arbitrum não encontrado");
        }
      });
      await sleep(1000);

      console.log('Preenchendo o CNPJ do comprador...');
      await page.type('input[placeholder*="CNPJ"]', dados.cnpj);
      await sleep(1000);
    }

    console.log('Preenchendo a carteira do comprador...');
    await page.type('input[placeholder*="carteira"]', dados.address);
    await sleep(1000);

    console.log('Clicando no botão "Confirmar dados"...');
    await page.click('#terms_policies');
    await sleep(1000);

    console.log('Clicando no botão "Confirmar dados"...');
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

    console.log('Clicando no botão "Solicitar conversão"...');
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
    console.log('Erro ao gerar Pix:', error);
    return callBackGetResult({
      error: error.message,
    });
  } finally {
  }

  console.log('Retornando os dados da transação...');
  console.log('Payload PIX:', payloadPix);
  console.log('ID da transação:', transactionId);
  console.log('RID da transação:', transactionRid);
  console.log('Status da transação:', status);

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
