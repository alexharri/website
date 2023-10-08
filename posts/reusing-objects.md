---
title: "Making GRID's spreadsheet engine 10% faster by sharing immutable objects"
description: ""
publishedAt: ""
image: ""
---

GRID's spreadsheet engine is a beaut. It's a sophisticated and feature-complete spreadsheet engine, supporting advanced features like [spilling][spilling], [iterative calculation][iterative_calculation], and the [`QUERY` function][query_func]. As a member of GRID's Engine Team, I got to implement some of these features, and do a lot of interesting performance and optimization work.

[spilling]: https://grid.is/@hjalli/spilling-support-in-grid-Uq_xPRt7SXuKlWf2WnwYZA
[iterative_calculation]: https://grid.is/@hjalli/iterative-calculations-example-hjmC1fe5RoqjEstgAEnaJw
[query_func]: https://grid.is/@grid/summarize-data-with-the-query-function-InXxO_7vS6KNkV6tYScx3Q

The Engine Team regularly handles customer care requests relating to bugs and performance issues in spreadsheets. Last June, I took a look at a particularly large and complicated spreadsheet where a write to a single cell caused ~12.000 cells to be recalculated. The recalculation took >700ms to execute on my machine (M1 Pro).

Profiling the recalculation, about 12.5% of the time was spent in a method called `_makeCalcCellEvaluationContext`.

<Image src="~/profiler.png" plain />

In this post, we'll explore the trick we used to take this time to near zero.


## GRID's Spreadsheet Engine

Spreadsheets have _a lot_ of use cases, ranging from budget management and attendance sheets, all the way to complex financial models. At the heart of the more complex models are dependencies. Cells depending on other cells.

 * A mortgage calculator may have cells depending, directly or indirectly, on a cell representing an `Interest Rate`.
 * In a spreadsheet to calculate marketing spend, the `Interest Rate` might be replaced with `Cost-per-Click` and `Conversion Rate` variables instead.

<Image src="~/mortgage-calculator.png" plain width={400} />

<SmallNote label="" center moveCloserUpBy={24}>An example of what the inputs to a mortgage calculator might look like</SmallNote>

Different scenarios are modeled by adjusting the inputs and seeing how the model reacts.

> _How high do the payments become when I reduce the loan term by X?_
>
> _What if the interest rate rises to 9%?_

For the model to "react" to changes in the inputs:

 * Cells depending on the changed input cell need to be recalculated.
 * To find the cell's dependents, the model employs a dependency graph.

This cycle of recalculating dependents occurs recursively. A cell's value changing when recalculated causes cells depending on it to be recalculated, and so forth. In the following example, every cell — except the first cell — depends on the preceding cell, forming a chain of calculations.

<iframe src="https://grid.is/embed/project-x-revenue-model-calculator-svb0l49pTlGx64orRDXjJQ" width="100%" height="440" data-document-id="b2f6f497-8f69-4e51-b1eb-8a2b4435e325" style={{ border: "0px" }}referrerPolicy="strict-origin-when-cross-origin"></iframe>
<script type="text/javascript" src="https://grid.is/static/embed/v1/script.js"></script>

This GRID document is powered by an underlying spreadsheet that looks like so:

<iframe src="https://grid.is/embed/exponential-grow-copy-LglRQ4ToRsu10ukWgl1msw" width="100%" height="448" data-document-id="2e095143-84e8-46cb-b5d2-e916825d66b3" style={{ border: "0px" }} referrerPolicy="strict-origin-when-cross-origin"></iframe>
<script type="text/javascript" src="https://grid.is/static/embed/v1/script.js"></script>

This spreadsheet is simple, but more complex models often contain tens or hundrends of thousands of cells. A single output cell is often the product of calculations encompassing dozens of thousands of cells. And the reverse! A single input cell is often indirectly used in the majority of calculations in a spreadsheet.


## The cost of recalculation

The cost of recalculation can be split into a two distinct parts:

 1. Determining which cells to recalculate, and in which order.
 2. Recalculating cells.

The recalculation of cells can further be split up into the fixed cost associated with recalculating a cell, and the variable cost associated with recalculating a cell.

The variable cost is more immediately obvious: A cell invoking an expensive function like `QUERY` on a large dataset will take longer to recalculate than a cell adding two numbers together.

The variable cost just depends on how expensive the user-written formula for the cell is.

```
# This will take a while
=QUERY(A:E, "select Name, Age where Age > 18 order by Name desc");

# This will take no time at all
=SUM(D3:D7)
```

Cells also need to have access to some contextual information. For example, when using a reference like `A:A`, the engine needs to know which workbook and sheet to resolve the `A:A` reference in. Given that the formula is written in `Sheet1` in `workbook.xlsx`:

```
# Resolves to '[workbook.xlsx]Sheet1!A:A'
=A:A

# Resolves to '[workbook.xlsx]Sheet2!A:A'
=Sheet2!A:A

# Resolves to '[numbers.xlsx]Sheet3!A:A'
=[numbers.xlsx]Sheet3!A:A
```

In addition to the current workbook and sheet, there's a lot of contextual information that cells _may_ need during recalculation. For example:

 * When using structured references without a table name such as `[[#This row], [Value]]`, the engine needs to resolve the table encompassing the cell.
 * Because Excel and Google Sheets implement some (_a lot_) of functions differently, GRID contains Excel and Google Sheets mode for compatibility. Spreadsheet functions need to be able to resolve the current mode to match mode-specific behaviors.

To provide this contextual information, the engine constructs an object containing this information — which we call the _evaluation context_ — in a method called  `_makeCalcCellEvaluationContext`. This is what we see taking 12.5% of recalculation time.

<Image src="~/profiler.png" plain />

Constructing the evaluation context is done once for each cell, and the cost of constructing it is the same for every cell. This is the fixed cost associated with reclaculating a cell.

The fixed cost was especially high for this particular workbook because there were thousands of cells being recalculated, and the formulas themselves were not very expensive. In workbooks with fewer, more expensive formulas, the variable cost would dominate over the fixed cost.

```
[Graph showing fixed vs variable cost dynamic]
```


Whether individual pieces of information in the evaluation context were consumed depends entirely on the cell's formula, and the functions it invokes. We were expending a fixed amount of effort for a variable amount of benefit.


## Evaluating the fixed cost

When recalculating a cell, the evaluation context would be created and passed to a `evaluateCellFormula` function.

```tsx
const ctx = this._makeCalcCellEvaluationContext(cell, ref, ...);
const value = evaluateCellFormula(cell, ctx);
```

The `_makeCalcCellEvaluationContext` method's implementation looked something like so:

```tsx
class Workbook implements EvaluationContext {
  _makeCalcCellEvaluationContext (cell: Cell, ref: Reference, ...) {
    // These properties and methods read the
    // arguments 'cell', 'ref', etc.
    const property1 = ...;
    const property2 = ...;
    const method1 = () => { ... };
    const method2 = () => { ... };
  
    const evaluationContext: EvaluationContext = {
      ...this,
      property1,
      property2,
      method1,
      method2,
      // ...
    };
    return evaluationContext
  }
}
```

We're doing a few things here:

 1. Computing some properties and defining some methods.
 2. Spreading the workbook (`this`) into a new object, alongside the properties and methods.

Creating the properties and methods does not seem very expensive. However, the sheer number of repitions starts to create issues. Creating 10 properties and methods for 12,000 cells results in 120,000 properties and methods to compute and allocate. That's a lot.

In addition to the properties and methods, the `Workbook` class itself was quite large. Assigning it into a new object required assigning 30+ methods into a new object. Repeated 12,000 times, that becomes significant amount of work.

As we saw in the profiler, this amounted to 12.5% work done during recalculation.


## Eliminating the fixed cost

To reduce the work we were doing, we want to do a few things:

 1. Do not compute properties ahead of time. Compute them lazily on-demand.
 2. Do not spread `this` into a new object for each evaluation.

The first step in doing less work is to lazily compute the properties. This could be done with getters:

```tsx
const method1 = ...;
const method2 = ...;

const evaluationContext: EvaluationContext = {
  ...this,
  get property1 () { ... },
  get property2 () { ... },
  method1,
  method2,
  // ...
};
return evaluationContext
```

Now we're only computing those properties when they're actually used, resulting in less work. Fantastic!

To avoid spreading `this` over and over, we created a single shared evaluation context, encapsulated in a new `CellEvaluator` class.

```tsx
class CellEvaluator {
  private evaluationContext: EvaluationContext;
  private cell: Cell;
  private ref: Reference;
  // ...
  
  constructor (workbook: Workbook) {
    const self = this;
    
    this.evaluationContext = Object.freeze({
      ...workbook,

      // The getters and methods access `cell`, `ref` (etc)
      // via `self.{key}`
      get property1 () { ... },
      get property2 () { ... },
      method1 () { ... },
      method2 () { ... },
    })
  }

  evaluate (cell: Cell, ref: Reference, ...) {
    this.cell = cell;
    this.ref = ref;
    // ...
    return evaluateCellFormula(cell, this.evaluationContext);
  }
}
```

The `CellEvaluator` contains a few private mutable properties, which the evaluation context has access to.

By creating a single shared evaluation context object, we avoid spreading the workbook into a new object repeatedly, which also creates less work for the garbage collector.

The code for cell evaluation also became a tad simpler:

```tsx
// Before
const ctx = this._makeCalcCellEvaluationContext(cell, ref, ...);
const value = evaluateCellFormula(cell, ctx);

// After
const value = this.cellEvaluator.evaluate(cell, ref, ...);
```


## Evaluating the impact

The Engine Team has developed a fairly sophisticated performance and regression testing suite for its spreadsheet engine. It runs on real public GRID documents and performs a series of tests measuring:

 * Initialization time
 * Write duration (recalculation performance)
 * Memory usage
 * Discrepancies (expected vs actual output)

This suite enables the engine team to evaluate the performance impact of changes (and detect discrepancies that our roughly 100,000 unit tests might fail to detect).

Running GRID's performance test suite on this change showed that it yielded roughly a 10% performance increase.

```
Proportional differences from baseline
  Median -9.92%
  Weighted geometric mean -9.58%

  74.9% decreased to <0.97x, 0.92% increased to >1.03x
  59.8% decreased to <0.93x, 0 increased to >1.08x
  0.34% decreased to <0.71x, 0 increased to >1.4x
  0.04% decreased to <0.5x, 0 increased to >2x

  1% -24.3% | 10% -17.6% | 90% -0.153% | 99% +2.93%

  Extremes:
    -70.5% (from 148 ms to 43.5 ms)
    -52.6% (from 589 ms to 279 ms)
    +5.94% (from 55.4 ms to 58.7 ms)
    +6.60% (from 89.7 ms to 95.6 ms)
```

