QUANTUM BRAIDING
================

PROBLEM
-------
- There are missing unitary transformations to achieve a universal quantum computer.
- By braiding quasi-particles, we can achieve missing quantum gates.
- How can those be achieved using the minimum braiding as possible.

FONCTIONNEMENT
--------------
- We init a qbit from 3 anyons following a special braid with 3 T charge.
- We braid anyons into a logic gate following the way the fuse together with parentheses.
- We let them fuse and look at the result.

- We start with two triplets of anyons.
- Insert a control pair from 1 to 2
- Perform CNOT
- Extract the control pair.

MATRIX OPERATIONS
-----------------
- Si AB = BA = I alors https://en.wikipedia.org/wiki/Invertible_matrix
- Unitary matrix if U^U = UU^ = Identity matrix - https://en.wikipedia.org/wiki/Unitary_matrix
Unitary matrices have significant importance in quantum mechanics because they preserve norms, and thus, probability amplitudes.
- Unitary matrices leave the length of a complex vector unchanged.
- Orthogonal matrix if U^U = UU^ = Identity matrix - https://en.wikipedia.org/wiki/Orthogonal_matrix
- Identity matrix https://en.wikipedia.org/wiki/Identity_matrix


IDEAS
-----
- Looks a lot like a L-system with some rules
- Looks like lambda calculus

LINGO
-----
- Hillbert space: infinite dimension extension of the euclidean space.
- Pentagon axiom: permutations de parenthèses autour de variables
((w * x) * y) * z
(w * x) * (y * z)
w * ((x * (y * z))
w * ((x * y) * z)
(w * (x * y)) * z
- XOR gate - CNOT gate is essential gate with qbit rotation https://en.wikipedia.org/wiki/Controlled_NOT_gate

VISUALISATION
-------------
- Two faced ribbons should be used. (ribbon structure)
- We can load the R & B * number matrix.

FIBONACCI ANYONS
----------------
- Anyons have a charge A represented by a vector.
- Anyons have an opposite charge A* which fused with A equals 0 (trivial charge)
- The charge is elementary, it cannot be decomposed.
- Fibonacci anyons have two charges 1 and T. (1 is trivial)
- Both are their anti-charge: T* = T and 1* = 1
- 3 anyons of charge T are necessary for a qbit

FUSION RULES
------------
- Operateur de fusion: @
- Operateur d'indecision: OR
- Tables:
1 @ 1 ~= 1
1 @ T ~= T @ 1 ~= T (commutatif)
T @ T ~= 1 OR T

Process :
((T @ T) @ T) ~= (1 OR T) @ T
              ~= (1 @ T) OR (T @ T)
              ~= T OR (1 OR T)
              ~= 1 OR 2 * T
- Donc la fusion de trois anyons de charge T donne soit branche 1, soit deux branches T.
- Deux permutations des parentheses autour de T @ T @ T:
soit (T @ T) @ T
soit T @ (T @ T)

FUSION
------
- Anyons will fuse if close enough.

GOAL
----
I looked at the current state of Fibonacci compilation. It seems to be summed up in the following two papers
https://arxiv.org/abs/1310.4150
https://arxiv.org/abs/1511.00719

Basically the game is to take a bunch of these weird particles and pretend they are a qubit. Then you decide on some qubit operation you want to do (the first paper is single qubits and the second is two qubits) and try to find some knitting pattern that does it.

Exactness is not always possible, so one needs to choose some amount of crappyness that they'll be happy with. We then need to find out how to get achieve this with as little knitting as we can.

This looks like something interesting for genetic algorithms to me. Perhaps we can even take some of the existing methods, mate them and evolve beyond them.

What do you think?

Newbie info: https://www.cs.ox.ac.uk/quantum/talksarchive/clap4/clap4-ericpaquette.pdf
