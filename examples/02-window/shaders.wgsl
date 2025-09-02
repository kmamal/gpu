
struct VertexShaderInput {
	@location(0) position: vec2<f32>,
	@location(1) color: vec3<f32>,
};

struct VertexShaderOutput {
	@builtin(position) position: vec4<f32>,
	@location(0) color: vec3<f32>,
};

@vertex
fn vertex_main(in: VertexShaderInput) -> VertexShaderOutput {
	var out: VertexShaderOutput;
	out.position = vec4<f32>(in.position, 0.0, 1.0);
	out.color = in.color;
	return out;
}


struct FragmentShaderOutput {
	@location(0) color: vec4<f32>,
};

@fragment
fn fragment_main(in: VertexShaderOutput) -> FragmentShaderOutput {
	var out: FragmentShaderOutput;
    out.color = vec4<f32>(in.color, 1.0);
	return out;
}

