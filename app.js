document.querySelectorAll('.toggle-btn').forEach(button => {
  button.addEventListener('click', () => {
    const steps = button.nextElementSibling;
    steps.classList.toggle('hidden');
    button.textContent = steps.classList.contains('hidden')
      ? 'Show cooking steps'
      : 'Hide cooking steps';
  });
});
