export namespace test {

QUnit.test("test1", (assert: Assert) => {
    assert.ok( false, "text1");
});

QUnit.test("test2", (assert: Assert) => {
    assert.ok( false, "text2");
});

QUnit.test("test3", (assert: Assert) => {
    assert.ok(true, "text3");
});

} // namespace test