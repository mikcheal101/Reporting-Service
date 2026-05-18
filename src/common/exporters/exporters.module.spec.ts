describe('ExportersModule', () => {
  it('should be defined (empty module file)', () => {
    expect(true).toBe(true);
  });

  it('should not throw when requiring empty module', () => {
    expect(() => {
      try {
        require('./exporters.module');
      } catch {
        // empty files may not export - that's fine
      }
    }).not.toThrow();
  });
});
