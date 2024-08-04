module.exports = {
    stripTags: function (input) {
        return input ? input.replace(/(<([^>]+)>)/gi, "") : input;
    },
    not: function (value) {
        return !value;
    },
    toList: function (input) {
        return input ? input.join(", ") : "";
    },
    getClasses: function (context) {
        return context.filter(item => item.kind === "class");
    },
    getInterfaces: function (context) {
        return context.filter(item => item.kind === "interface");
    },
    toLink: function (text) {
        return text ? text.toLowerCase().replace(/ /g, "-") : text;
    },
    getConstructors: function (context, id) {
        return Array.isArray(context) ? context.filter(item => item.memberof === id).filter(item => item.kind === "constructor").sort((a, b) => a.order - b.order) : [];
    },
    getMethods: function (context, id) {
        return Array.isArray(context) ? context.filter(item => item.memberof === id).filter(item => item.kind === "function").sort((a, b) => a.order - b.order) : [];
    },
    equals: function (a, b) {
        return a === b;
    },getTags: function({access, augments, scope, virtual}) {
        const tags = [];
        if (access) {
            tags.push(access);
        }
        if (scope &&  ["static"].includes(scope)) {
            tags.push(scope);
        }
        if (virtual) {
            tags.push("abstract");
        }
        if (augments) {
            tags.push("extends " + augments.join(", "));
        }
        return tags;
    },
};
  