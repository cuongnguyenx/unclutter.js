// https://code.tutsplus.com/articles/data-structures-with-javascript-tree--cms-23393
function Node(data) {
    this.data = data;
    this.parent = null;
    this.children = [];
}

function Tree(data) {
    var node = new Node(data);
    this._root = node;
}

function linkHierachy(data) {
    this.tree = new Tree(data);
    this.globalHierachy = [];
    this.localHierachy = [];
}

function Queue() {
    this.dataStore = []
    this.enqueue = function enqueue(element) {
        this.dataStore.push(element)
    }
    this.dequeue = function dequeue() {
        return this.dataStore.shift()
    }
    this.front = function front() {
        return this.dataStore[0]
    }
    this.back = function back() {
        return this.dataStore[this.dataStore.length - 1]
    }
}

Tree.prototype.traverseDF = function (callback, parentHierachy) {

    // this is a recurse and immediately-invoking function
    (function recurse(currentNode, level, parentHierachy) {
        // step 2
        for (var i = 0, length = currentNode.children.length; i < length; i++) {
            // step 3
            recurse(currentNode.children[i], level + 1, parentHierachy);
        }

        // step 4
        callback(currentNode, level, parentHierachy);

        // step 1
    })(this._root, 0, parentHierachy);

};

Tree.prototype.traverseBF = function (callback) {
    var queue = new Queue();

    queue.enqueue(this._root);

    currentTree = queue.dequeue();

    while (currentTree) {
        for (var i = 0, length = currentTree.children.length; i < length; i++) {
            queue.enqueue(currentTree.children[i]);
        }

        callback(currentTree);
        currentTree = queue.dequeue();
    }
};

Tree.prototype.contains = function (callback, traversal) {
    traversal.call(this, callback);
};

Tree.prototype.add = function (data, toData, traversal) {
    // toData from outside scope is unnecessary
    let child = new Node(data)
    let parent = null
    if (toData === "master") {
        parent = this._root
    }
    let callback = function (node) {
            if (node.data === toData) {
                parent = node;
            }
        }; // check if parent (toData) exist in Tree

    if (parent == null) {
        toData = increaseDomainLevel(data);
        while (toData !== "https:/") {
            this.contains(callback, traversal);
            if (parent !== null) {
                break
            }
        toData = increaseDomainLevel(toData)
        }
    }


    if (parent != null) {
        parent.children.push(child);
        child.parent = parent;


        let idx_remove = []
        parent.children.forEach((element, index) => {
            if (compareNode(child.data, element.data) === 1) {
                idx_remove.push(index)
            }
        });

        idx_remove.forEach(element => {
           var removed = parent.children.splice(element, 1); // should get a one-element array
            removed[0].parent = child
            child.children.push(removed[0])
        });

    } else {
        throw new Error('Cannot add node to a non-existent parent.');
    }
};

Tree.prototype.remove = function (data, fromData, traversal) {
    var tree = this,
        parent = null,
        childToRemove = null,
        index;

    var callback = function (node) {
        if (node.data === fromData) {
            parent = node;
        }
    };

    this.contains(callback, traversal);

    if (parent) {
        index = findIndex(parent.children, data);

        if (index === undefined) {
            throw new Error('Node to remove does not exist.');
        } else {
            childToRemove = parent.children.splice(index, 1);
        }
    } else {
        throw new Error('Parent does not exist.');
    }

    return childToRemove;
};

// get the top-level domain of a website. I.E https://nytimes.com/a/b/c will yield https://nytimes.com
function getLinkRoot(link) {
    let startIndex = link.search("https://"); // should be 0 if exist
    if (startIndex > -1) {
        startIndex += 8
    } else {
        startIndex = 0
    }

    let endIndex = link.indexOf("/", startIndex);
    if (endIndex === -1) {
        endIndex = link.length
    }

    return (link.indexOf("www.") === -1) ? link.substring(0, endIndex).replace("https://", "www.") :
        link.substring(0, endIndex).replace("https://", "")
}

// return the parent of this link. I.E https://nytimes.com/a/b/c will yield https://nytimes.com/a/b
function increaseDomainLevel(link) {
    return link.substring(0, link.lastIndexOf("/"))
}


// check if linkA is either the child, the parent, or has no relationship to linkB
// returns 1 if linkA is parent of linkB, -1 if linkA is child of linkB, and 0 if linkA has no relation to linkB
// no two links stored in storage will be the same, therefore checking for equality is not necessary
function compareNode(linkA, linkB) {
    linkA = linkA.replace("https://", "")
    linkB = linkB.replace("https://", "")

    let linkA_tokenized = linkA.split("/")
    let linkB_tokenized = linkB.split("/")

    if (linkA_tokenized[0] !== linkB_tokenized[0]) {
        return 0;
    } else {
        if (linkA_tokenized.length < linkB_tokenized.length) {
            return 1;
        } else {
            return -1
        }
    }
}

function findCommonAncestor(linkA, linkB) {
    linkA = linkA.replace("https://", "")
    linkB = linkB.replace("https://", "")

    let linkA_tokenized = linkA.split("/")
    let linkB_tokenized = linkB.split("/")
    let common_elems = 0;

    for (var i = 0; i < Math.min(linkA_tokenized.length, linkB_tokenized.length); i++) {
        if (linkA_tokenized[i] === linkB_tokenized[i]) {
            common_elems++;
        } else {
            break;
        }
    }
    return common_elems
}

function isLinkRoot(link) {
    link = link.replace("https://", "")
    // index of the last slash character in link
    // if link is a root link, @indexLastSlash will either be -1 or @link.length -1
    let indexLastSlash = link.indexOf("/")
    return (indexLastSlash === -1 || indexLastSlash === link.length -1)
}

function findIndex(arr, data) {
    var index;

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].data === data) {
            index = i;
        }
    }

    return index;
}


let callbackxx = function (node, level, hierachy) {
    let pad = ""
    for (var i = 0; i < level; i++) {
        pad += "\t"
    }

    hierachy.localHierachy.push(pad + node.data)
    if (isLinkRoot(node.data)) {
        hierachy.localHierachy.reverse();
        hierachy.globalHierachy.push.apply(hierachy.globalHierachy, hierachy.localHierachy);
        hierachy.localHierachy = [];
    }
};

function addToTreeIndividual(hierachy, data, traversal) {
    let root = getLinkRoot(data)
    let foundNode = false;
    var callbackTop = function (node) {
        if (node.data === root) {
            foundNode = true;
            return;
        }
    }

    let x = hierachy.tree.contains(callbackTop, traversal);
    if (!foundNode) {
        hierachy.tree.add(root, "master", traversal)
    }
    hierachy.tree.add(data, "", traversal)
}

function addToTreeMass(hierachy, dataMul, traversal) {
    dataMul.forEach(element => {
       addToTreeIndividual(hierachy, element, traversal)
    });
}

/*
let testHierachy = new linkHierachy("master");
addToTreeIndividual(testHierachy, "https://amazon.com/a/b/c", testHierachy.tree.traverseBF);
addToTreeIndividual(testHierachy,"https://amazon.com/a/b", testHierachy.tree.traverseBF);
addToTreeIndividual(testHierachy, "https://amazon.com/a/b/e/d", testHierachy.tree.traverseBF);
addToTreeIndividual(testHierachy, "https://amazon.com/a/c/e/d", testHierachy.tree.traverseBF);
addToTreeIndividual(testHierachy,"https://nytimes.com/a/b", testHierachy.tree.traverseBF);
addToTreeIndividual(testHierachy, "https://nytimes.com/a/b/e/d", testHierachy.tree.traverseBF);
addToTreeIndividual(testHierachy, "https://nytimes.com/a/c/e/d", testHierachy.tree.traverseBF);
addToTreeIndividual(testHierachy, "https://nytimes.com/a/c/", testHierachy.tree.traverseBF);
addToTreeMass(testHierachy, ["https://vnexpress.net/a/b", "https://vnexpress.net/b/c/d", "https://vnexpress.net/b/c"],
    testHierachy.tree.traverseBF);

testHierachy.tree.traverseDF(callbackxx, testHierachy);
for (var i = 0; i < testHierachy.globalHierachy.length; i++) {
    console.log(testHierachy.globalHierachy[i]);
}
 */


