const slides = document.querySelectorAll('.slide');
const slidesContainer = document.querySelector('.slides-container');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const slideCounter = document.getElementById('slideCounter');
const progressBar = document.getElementById('progressBar');

const stepButtons = document.querySelectorAll('.step-btn');
const archNodes = document.querySelectorAll('.arch-node');
const stepInfo = document.getElementById('stepInfo');

const stepDescriptions = {
  1: '<strong>1. Captação na PCB:</strong> Os sensores captam grandezas físicas (sinais analógicos no LDR e MQ-135 convertidos para digital via ADC, e sinal digital no DHT11). O ESP32 processa esses dados localmente.',
  2: '<strong>2. Envio via Rádio (Wi-Fi / MQTT):</strong> O ESP32 serializa os dados em JSON e envia via rede Wi-Fi usando o protocolo MQTT para o servidor Orange Pi.',
  3: '<strong>3. Orange Pi &amp; Broker MQTT:</strong> O Broker Mosquitto organiza as mensagens e aplica regras de segurança (usuário, senha e permissões ACL de leitura/escrita). A API Python grava tudo no histórico .csv.',
  4: '<strong>4. Dashboard &amp; Usuário Final:</strong> O servidor expõe a aplicação em domínio próprio protegido via Cloudflare. O usuário acessa o Modo Ao Vivo (MQTT) ou o Modo Cientista (gráficos do .csv).'
};

let currentSlide = 0;

function updatePresentation() {
  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentSlide);
  });

  // Volta o scroll para o topo ao trocar de slide no celular
  slidesContainer.scrollTop = 0;

  slideCounter.textContent = `${currentSlide + 1} / ${slides.length}`;
  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === slides.length - 1;

  const progress = ((currentSlide + 1) / slides.length) * 100;
  progressBar.style.width = `${progress}%`;
}

function setArchitectureStep(step) {
  stepButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.step === String(step));
  });

  archNodes.forEach((node) => {
    const isMatch = node.dataset.step === String(step);
    node.classList.toggle('active-node', isMatch);
    node.classList.toggle('dimmed', !isMatch);
  });

  if (stepDescriptions[step]) {
    stepInfo.innerHTML = stepDescriptions[step];
  }
}

function nextSlide() {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    updatePresentation();
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    updatePresentation();
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

// Botões
prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Teclado (PC)
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === ' ') {
    event.preventDefault();
    nextSlide();
  } else if (event.key === 'ArrowLeft') {
    prevSlide();
  } else if (event.key.toLowerCase() === 'f') {
    toggleFullscreen();
  }
});

// Gesto de Swipe (Celular)
let touchStartX = 0;
let touchStartY = 0;
let ignoreSwipe = false;

slidesContainer.addEventListener('touchstart', (e) => {
  // Não troca de slide se o usuário estiver arrastando o diagrama, código ou tabela
  ignoreSwipe = Boolean(e.target.closest('.arch-wrapper, pre, .summary-table'));
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

slidesContainer.addEventListener('touchend', (e) => {
  if (ignoreSwipe) return;

  const diffX = e.changedTouches[0].clientX - touchStartX;
  const diffY = e.changedTouches[0].clientY - touchStartY;

  // Só troca se o movimento for claramente horizontal
  if (Math.abs(diffX) > 55 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
    if (diffX < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  }
}, { passive: true });

// Interação do Slide 2
stepButtons.forEach((btn) => {
  btn.addEventListener('click', () => setArchitectureStep(btn.dataset.step));
});

archNodes.forEach((node) => {
  node.addEventListener('click', () => setArchitectureStep(node.dataset.step));
});

// Inicialização
updatePresentation();
setArchitectureStep(1);

// Interação do Diagrama Animado de Código (Slide 5)
const codeStepButtons = document.querySelectorAll('.code-step-btn');
const codeArchNodes = document.querySelectorAll('.code-arch-node');
const codeStepInfo = document.getElementById('codeStepInfo');

const codeStepDescriptions = {
  1: '<strong>1. TarefaSensores (Núcleo 1 • a cada 5 s):</strong> Lê DHT11, LDR e MQ-135 usando <code>vTaskDelayUntil()</code> para manter o período exato. Valida os limites e atualiza a <code>struct DadosSIMA</code>.',
  2: '<strong>2. Cadeado Mutex (<code>mutexDados</code>):</strong> Impede <em>Condição de Corrida</em> entre os núcleos. Só uma tarefa entra na variável por vez via <code>xSemaphoreTake()</code> e libera com <code>xSemaphoreGive()</code>.',
  3: '<strong>3. TarefaAlarme (Núcleo 1 • a cada 200 ms):</strong> Consulta os dados protegidos pelo Mutex em ciclo rápido para ligar/desligar o Buzzer imediatamente — mesmo se o Wi-Fi cair.',
  4: '<strong>4. TarefaMQTT (Núcleo 0 • envio a cada 5 s):</strong> Mantém Wi-Fi e Mosquitto conectados, copia os dados com <code>obterDados()</code>, monta o JSON e faz <code>client.publish()</code> no tópico.'
};

function setCodeStep(step) {
  codeStepButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.cstep === String(step));
  });

  codeArchNodes.forEach((node) => {
    const isMatch = node.dataset.cstep === String(step);
    node.classList.toggle('active-node', isMatch);
    node.classList.toggle('dimmed', !isMatch);
  });

  if (codeStepDescriptions[step] && codeStepInfo) {
    codeStepInfo.innerHTML = codeStepDescriptions[step];
  }
}

codeStepButtons.forEach((btn) => {
  btn.addEventListener('click', () => setCodeStep(btn.dataset.cstep));
});

codeArchNodes.forEach((node) => {
  node.addEventListener('click', () => setCodeStep(node.dataset.cstep));
});

if (codeStepButtons.length > 0) {
  setCodeStep(1);
}

