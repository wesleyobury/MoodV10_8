let next=null; module.exports={__esModule:true, setNext:(r)=>{next=r}, calls:[], apiFetch:async(path,opts)=>{module.exports.calls.push({path,opts}); return next}, authFetch:async()=>({ok:false})};
