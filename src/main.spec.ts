describe('Bootstrap', () => {
  it('should have main module that can be required', () => {
    expect(() => {
      require('./main');
    }).not.toThrow();
  });
});
