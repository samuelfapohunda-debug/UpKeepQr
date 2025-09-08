// Form submission handler for all forms
export async function submitForm(event) {
  event.preventDefault();
  
  const form = event.target;
  const formType = form.dataset.formType;
  const submitButton = form.querySelector('button[type="submit"]');
  const submitText = submitButton.querySelector('.submit-text');
  const loadingText = submitButton.querySelector('.loading-text');
  const successDiv = document.getElementById('form-success');
  const errorDiv = document.getElementById('form-error');
  
  // Hide previous messages
  successDiv?.classList.add('hidden');
  errorDiv?.classList.add('hidden');
  
  // Show loading state
  submitButton.disabled = true;
  submitText.classList.add('hidden');
  loadingText.classList.remove('hidden');
  
  try {
    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.formType = formType;
    
    // Submit to API
    const response = await fetch('/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // Show success message
      successDiv?.classList.remove('hidden');
      form.reset();
      
      // Track form submission
      if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
          'form_type': formType,
          'success': true
        });
      }
    } else {
      throw new Error(result.message || 'Form submission failed');
    }
    
  } catch (error) {
    console.error('Form submission error:', error);
    errorDiv?.classList.remove('hidden');
    
    // Track error
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submit', {
        'form_type': formType,
        'success': false,
        'error': error.message
      });
    }
  } finally {
    // Reset button state
    submitButton.disabled = false;
    submitText.classList.remove('hidden');
    loadingText.classList.add('hidden');
  }
}