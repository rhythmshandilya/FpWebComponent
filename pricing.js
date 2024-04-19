export default class MyCustomComponent extends HTMLElement {

  constructor() {
    super();
    this.currentPlans = []
    this.attachShadow({ mode: 'open' });
  }

  // The browser calls this method when the element is
  // added to the DOM.
  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'email') {
        this.render();
    }
  }

  createFeatureListHTML(featureList) {
    return featureList.map(feature => {
      return `
        <div class="feature">
          <div>${feature.status === 'pro' ? '+' : '-'}</div>
          <p>${feature.label}</p>
        </div>
      `
    }).join('');
  }

  createPricingPlanHTML(plan) {
    const featuresHTML = this.createFeatureListHTML(plan.featureList);
    return `
      <div class="pricing-plan-container ${plan.recommended ? "recommended": ""}">
        <div class="pricing-header">
          <h2>${plan.name}</h2>
          <p>${plan.description}</p>
          <div class="price">$${plan.price} <span>/ ${plan.timeInterval === "Lifetime" ? "one time" : "monthly"}</span></div>
          <button class="price-button" stripe-id=${plan.stripePricingPlanId}>Get Started Now</button>
        </div>
        <div class="features">
          ${featuresHTML}
        </div>
      </div>
    `;
  }

  createPricingPlansHTML(plans) {
    return plans.map(plan => {
      return `
        ${this.createPricingPlanHTML(plan)}
      `
    }).join('');
  }

  renderPlans(plans) {
    return `

      <div class="pricing-plans">
        ${this.createPricingPlansHTML(plans)}
      </div>
    `
  }

  renderPriceButton(label) {
    return `
      <button class="price-toggle-button" id=${label+'-button'}>
        ${label}
      </button>
    `
  }

  renderPriceToggleButton(monthlyPlans, yearlyPlans, lifetimePlans) {
    return `
      <div class="price-toggle-container">
        ${monthlyPlans.length > 0 && this.renderPriceButton('Yearly')}
        ${yearlyPlans.length > 0 && this.renderPriceButton('Monthly')}
        ${lifetimePlans.length > 0 && this.renderPriceButton('Lifetime')}
      </div>
    `
  }

  getStyling() {
    return `
      <style>
        .price-plan {
          padding: 12px;
          border: 1px dashed white;
        }
        .feature {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .pricing-plans {
          display: flex;
          gap: 22px;
          justify-content: center;
        }
        .pricing-plan-container {
          max-width: 28%;
          background-color: #313131;
          border-radius: 10px;
          padding: 30px 20px;
        }
        .feature p {
          margin: 4px 0px;
        }
        .pricing-plan-container.recommended {
          border: 2px solid #27EECB;
        }
        .price {
          font-size: 2.5rem;
          font-weight: 700;
          color: #27EECB;
        }
        .price span {
          font-size: 1rem;
          font-weight: 400;
          color: white;
        }
        button.price-button:active {
          color: #000000;
          background: #27EECB;
        }
        button.price-button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.35rem;
          border: 1px solid #27EECB;
          color: #27EECB;
          background: inherit;
          font-weight: 700;
          outline: unset;
          cursor: pointer;
          margin-top: 24px;
          margin-bottom: 24px;
        }
      </style>
    `
  }

  renderPricingPlans(timeInterval, monthlyPlans, yearlyPlans, lifetimePlans, email, callback) {
    const plans = timeInterval === "Lifetime" ? lifetimePlans : timeInterval === "Yearly" ? yearlyPlans : monthlyPlans;
    const planHTML = this.getStyling()
      + this.renderPriceToggleButton(monthlyPlans, yearlyPlans, lifetimePlans)
      +  this.renderPlans(plans);
    this.shadowRoot.innerHTML = planHTML ;

      // place event listener on price time interval toggle button
      const yearlyPriceButton = this.shadowRoot.getElementById('Yearly-button');
      // console.log(yearlyPriceButton);
      if (yearlyPriceButton) {
        yearlyPriceButton.addEventListener('click', () => this.renderPricingPlans("Yearly", monthlyPlans, yearlyPlans, lifetimePlans));
      } else {
        console.log("yearly button wasn't selected");
      }
      const monthyPriceButton = this.shadowRoot.getElementById('Monthly-button');
      if (monthyPriceButton) {
        monthyPriceButton.addEventListener('click', () => this.renderPricingPlans("Monthly", monthlyPlans, yearlyPlans, lifetimePlans));
      } else {
        console.log("monthly button wasn't selected");
      }
      const lifetimePriceButton = this.shadowRoot.getElementById('Lifetime-button');
      if (lifetimePriceButton) {
        lifetimePriceButton.addEventListener('click', () => this.renderPricingPlans("Lifetime", monthlyPlans, yearlyPlans, lifetimePlans));
      } else {
        console.log("lifetime button wasn't selected");
      }

      const pricingButtons = this.shadowRoot.querySelectorAll(".price-button");
      for (let idx = 0; idx < pricingButtons.length; idx++) {
        pricingButtons[idx].addEventListener('click', () => console.log(email, pricingButtons[idx].getAttribute('stripe-id')))
      }

  }

  render() {

    let called = false;
     const requestOptions = {
        method: "GET",
        redirect: "follow"
      }; fetch("http://127.0.0.1:8081/v2/pricing-plans/?source=culling", requestOptions)
        .then((response) => response.json())
        .then((res) => {
          if (res.sucess) {
            const plans = res.data;
            let yearlyPlans = plans.filter((plan) => plan.timeInterval === 'Yearly' && plan.active);
            yearlyPlans = yearlyPlans.sort((plan1, plan2) => plan1.order - plan2.order);
            let monthlyPlans = plans.filter((plan) => plan.timeInterval === 'Monthly' && plan.active);
            monthlyPlans = monthlyPlans.sort((plan1, plan2) => plan1.order - plan2.order);
            let lifetimePlans = plans.filter((plan) => plan.timeInterval === 'Lifetime' && plan.active);
            lifetimePlans = lifetimePlans.sort((plan1, plan2) => plan1.order - plan2.order);
            console.log('monthly plans are', monthlyPlans);
            console.log('yearly plans are', yearlyPlans);
            console.log('lifetime plans are', lifetimePlans);


            // const planHTML = this.getStyling()
            //   + this.renderPriceToggleButton(monthlyPlans, yearlyPlans, lifetimePlans)
            //   // +  this.renderPlans(this.currentPlans);
            // this.shadowRoot.innerHTML = planHTML;
            // this.shadowRoot.innerHTML = `<p>${this.getAttribute('email') || 'Default text'}</p>`;
            const email = this.getAttribute('email');
            console.log({email});
            const redirectCallback = this.getAttribute('redirectCallback');
            if (!called) {
              this.renderPricingPlans("Yearly", monthlyPlans, yearlyPlans, lifetimePlans, email, redirectCallback);
              called = true;
            }
          }
        })
        .catch((error) => console.error('Unable to fetch pricing plans', error));
  }

}

// Register the MyCustomComponent component using the tag name <current-date>.
customElements.define('fp-web-component-pricing', MyCustomComponent);
