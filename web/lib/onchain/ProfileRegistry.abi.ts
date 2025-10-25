export const ProfileRegistryAbi = [
  {"type":"function","name":"setProfile","stateMutability":"nonpayable","inputs":[
    {"name":"name","type":"string"},{"name":"phone","type":"string"}],"outputs":[]},
  {"type":"function","name":"getProfile","stateMutability":"view","inputs":[
    {"name":"user","type":"address"}],
    "outputs":[{"type":"string"},{"type":"string"},{"type":"bool"}]},
  {"type":"event","name":"ProfileUpdated","anonymous":false,"inputs":[
    {"name":"user","type":"address","indexed":true},
    {"name":"name","type":"string","indexed":false},
    {"name":"phone","type":"string","indexed":false}]}
] as const;
