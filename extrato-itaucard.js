(function() {

  const startOfx = () => {
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

    impressao.getElementsByTagName('table')[1].tBodies[0].querySelectorAll('tr').forEach(function(charge){
      
      chargeDetails = charge.getElementsByTagName('td');
      console.log(chargeDetails);
      const date = normalizeDate(chargeDetails[0].textContent);
      const description = chargeDetails[1].textContent.trim();
      const amount = normalizeAmount(chargeDetails[2].textContent);

      ofx += bankStatement(checkNum, date, amount, description);
      checkNum = ++checkNum;
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
    button.textContent = "exportar para OFX";

    button.addEventListener('click', generateOfx)

    return button;
  }
  
  const exportOfxButtonAlreadyExists = (tabId) =>
    document.querySelectorAll(".summary [role=\"gen-ofx-"+tabId+"\"]").length > 0

  const insertExportButtonCallback = (mutationList, observer) => {

    var showResumo = document.getElementsByClassName("showResumo");
    if (showResumo.length > 0) {
      console.log("Show Resumo encontrado!");
      const exportOfxButton =  createExportButton();
      showResumo[0].parentNode.appendChild(exportOfxButton);
      observer.disconnect();
    }

  }
  


  const targetElement = document.querySelector('body');
  console.log(targetElement);
  const config = { attributes: false, childList: true, subtree: true }
  
  const observer = new MutationObserver(insertExportButtonCallback);
  observer.observe(document, config)
  
})();

