(function() {

  const startOfx = () => {
    cardDetail = document.querySelector("#idImpressaoOuPDF > table:nth-child(2) > caption > strong").textContent;
    cardNumber = cardDetail.substring(cardDetail.length - 4);
    return `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
      <CURDEF>BRL
        <BANKACCTFROM>
          <BANKID>0341
          <ACCTID>${cardNumber}
          <ACCTTYPE>CHECKING
        </BANKACCTFROM>
        <BANKTRANLIST>`;
  }

  const endOfx = () =>
    `
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

  const bankStatement = (id, date, amount, description) =>
    `
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <FITID>${id}
            <CHECKNUM>${id}
            <DTPOSTED>${date}</DTPOSTED>
            <TRNAMT>${amount * -1}</TRNAMT>
            <MEMO>${description}</MEMO>
          </STMTTRN>`;

  const normalizeAmount = (text) =>
    text.replace('.', '').replace(',','.');


  const normalizeDate = (date) => {
    const dateArray = date.split('/');
    const year = new Date().getFullYear();

    return year+dateArray[1]+dateArray[0];
  }

  
  const exportOfx = (ofx) => {
    link = document.createElement("a");
    link.setAttribute("href", 'data:application/x-ofx,'+encodeURIComponent(ofx));
    link.setAttribute("download", "itaucard.ofx");
    link.click();
  }

  const generateOfx = (event) => {
    
    let ofx = startOfx();
    
    var impressao = document.getElementById("idImpressaoOuPDF");
    let checkNum = 1;

    impressao.querySelectorAll('table').forEach(function(chargeTable){
      if (chargeTable.getAttribute('summary') === 'Tabela com informações de saldo da fatura anterior') {
        chargeTable.tBodies[0].querySelectorAll('tr').forEach(function(charge){
          chargeDetails = charge.getElementsByTagName('td');
          console.log(chargeDetails);
          if (chargeDetails[1].textContent.trim !== "" && chargeDetails[1].textContent.indexOf('/') >= 0) { 
            const date = normalizeDate(chargeDetails[1].textContent);
            const description = chargeDetails[2].textContent.trim();
            const amount = normalizeAmount(chargeDetails[3].textContent);
            ofx += bankStatement(checkNum, date, amount, description);
            checkNum = ++checkNum;
          }
        });
      }
      else if (chargeTable.getAttribute('summary') === 'Tabela de lançamentos nacionais do cartão de crédito') {
        chargeTable.tBodies[0].querySelectorAll('tr').forEach(function(charge){
          chargeDetails = charge.getElementsByTagName('td');
          console.log(chargeDetails);
          let date = normalizeDate(chargeDetails[0].textContent);
          const description = chargeDetails[1].textContent.trim();
          const amount = normalizeAmount(chargeDetails[2].textContent);

          //Verifica se é um parcelamento
          
          if ( /\d{2}\/\d{2}/.test(description) && !/01\/\d{2}/.test(description)) {
            mes = document.querySelector("#faturaCartao > div:nth-child(5) > div:nth-child(2) > p.info.info-medium").textContent.substr(3,2) - 1;
            if (mes.toString.length < 2) { mes = "0" + mes; }
            date = normalizeDate("01/" + mes);
          }

          ofx += bankStatement(checkNum, date, amount, description);
          checkNum = ++checkNum;
        });
      }
      else if ((chargeTable.getAttribute('summary') === 'Tabela de lançamentos internacionais do cartão de crédito')) {
        chargeTable.tBodies[0].querySelectorAll('tr').forEach(function(charge){
          chargeDetails = charge.getElementsByTagName('td');
          console.log(chargeDetails);
          const date = normalizeDate(chargeDetails[0].textContent);
          const description = chargeDetails[1].textContent.trim();
          const amount = normalizeAmount(chargeDetails[5].textContent);

          ofx += bankStatement(checkNum, date, amount, description);
          checkNum = ++checkNum;
        });
      }
      else if ((chargeTable.getAttribute('summary') === 'Tabela de encargos e serviços, pré-pago e compras')) {
        chargeTable.tBodies[0].querySelectorAll('tr').forEach(function(charge){
          chargeDetails = charge.getElementsByTagName('td');
          console.log(chargeDetails);
          if (chargeDetails[0].textContent.trim !== "" && chargeDetails[0].textContent.indexOf('/') >= 0) { 
            const date = normalizeDate(chargeDetails[0].textContent);
            const description = chargeDetails[1].textContent.trim();
            const amount = normalizeAmount(chargeDetails[2].textContent);
            ofx += bankStatement(checkNum, date, amount, description);
            checkNum = ++checkNum;
          }
          
        });
      }
    });


    ofx += endOfx();
    
    exportOfx(ofx);
  }

  const createExportButton = () => {
    const button = document.createElement('a');

    button.classList.add('anchor');
    button.classList.add('secondary');
    button.setAttribute('tabindex', '0');
    button.setAttribute('href', '#');
    button.setAttribute('id', 'exportarOFX');
    button.textContent = "exportar para OFX";

    button.addEventListener('click', generateOfx)

    return button;
  }
  


  const insertExportButtonCallback = (mutationList, observer) => {

    var showResumo = document.getElementsByClassName("showResumo");
    var exportButton = document.getElementById('exportarOFX');
    if (showResumo.length > 0 && !exportButton) {
      console.log("Show Resumo encontrado!");
      const exportOfxButton =  createExportButton();
      showResumo[0].parentNode.appendChild(exportOfxButton);
      //observer.disconnect();
    }

  }
  


  const targetElement = document.querySelector('body');
  console.log(targetElement);
  const config = { attributes: false, childList: true, subtree: true }
  
  const observer = new MutationObserver(insertExportButtonCallback);
  observer.observe(document, config)
  
})();

