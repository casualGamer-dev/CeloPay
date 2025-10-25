export const KeyRegistryAbi = [
  {"type":"function","name":"setKeys","stateMutability":"nonpayable","inputs":[
    {"name":"kyber","type":"string"},{"name":"dilithium","type":"string"}],"outputs":[]},
  {"type":"function","name":"getKeys","stateMutability":"view","inputs":[
    {"name":"user","type":"address"}],
    "outputs":[{"type":"string"},{"type":"string"},{"type":"bool"}]},
  {"type":"event","name":"KeysUpdated","anonymous":false,"inputs":[
    {"name":"user","type":"address","indexed":true},
    {"name":"kyber","type":"string","indexed":false},
    {"name":"dilithium","type":"string","indexed":false}]}
] as const;
